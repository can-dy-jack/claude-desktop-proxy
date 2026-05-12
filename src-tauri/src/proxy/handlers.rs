use axum::body::Body;
use axum::extract::State;
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use futures_util::TryStreamExt;
use reqwest::Client;
use serde_json::{json, Value};

use crate::config::store::{AppConfig, Profile};

use super::server::ProxyContext;

fn token_tail(token: &str) -> String {
    let compact = token.trim();
    if compact.len() <= 6 {
        compact.to_string()
    } else {
        compact[compact.len() - 6..].to_string()
    }
}

fn extract_gateway_token(headers: &HeaderMap) -> Option<String> {
    let auth = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .trim()
        .to_string();

    if !auth.is_empty() {
        let mut parts = auth.split_whitespace();
        let scheme = parts.next().unwrap_or_default();
        let token = parts.next().unwrap_or_default().trim();
        if scheme.eq_ignore_ascii_case("bearer") && !token.is_empty() {
            return Some(
                token
                    .trim_matches('"')
                    .trim_matches('\'')
                    .trim_end_matches(',')
                    .to_string(),
            );
        }
        return Some(
            auth.trim_matches('"')
                .trim_matches('\'')
                .trim_end_matches(',')
                .to_string(),
        );
    }

    let api_key = headers
        .get("x-api-key")
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .trim();
    if !api_key.is_empty() {
        return Some(
            api_key
                .trim_matches('"')
                .trim_matches('\'')
                .trim_end_matches(',')
                .to_string(),
        );
    }

    None
}

fn profile_by_gateway_token(
    config: &AppConfig,
    token: &str,
) -> Option<Profile> {
    config
        .profiles
        .iter()
        .find(|p| p.gateway_token.trim() == token)
        .cloned()
}

    fn active_profile_from_config(config: &AppConfig) -> Option<Profile> {
        let active_id = config.active_profile_id.as_deref()?;
        config
        .profiles
        .iter()
        .find(|p| p.id == active_id)
        .cloned()
    }

fn profile_from_request(ctx: &ProxyContext, headers: &HeaderMap) -> Result<Profile, (StatusCode, String)> {
    let token = extract_gateway_token(headers)
        .ok_or((StatusCode::UNAUTHORIZED, "missing gateway token".to_string()))?;

    let config = ctx
        .store
        .load()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    if token.eq_ignore_ascii_case("local") {
        if let Some(profile) = active_profile_from_config(&config) {
            ctx.logger.push(
                "warn",
                "proxy",
                "gateway token is 'local'; fallback to active profile",
            );
            return Ok(profile);
        }
        return Err((StatusCode::BAD_REQUEST, "no active profile".to_string()));
    }

    if let Some(profile) = profile_by_gateway_token(&config, &token) {
        return Ok(profile);
    }

    ctx.logger.push(
        "warn",
        "proxy",
        format!(
            "gateway token mismatch: recv=*{} active={} profiles={}",
            token_tail(&token),
            config.active_profile_id.unwrap_or_else(|| "none".to_string()),
            config.profiles.len()
        ),
    );

    Err((StatusCode::UNAUTHORIZED, "invalid token".to_string()))
}

fn ensure_claude_prefix(input: &str) -> String {
    let raw = input.trim();
    if raw.is_empty() {
        return "claude-unknown".to_string();
    }
    let without_vendor = raw.strip_prefix("anthropic/").unwrap_or(raw);
    if without_vendor.starts_with("claude-") {
        without_vendor.to_string()
    } else {
        format!("claude-{without_vendor}")
    }
}

pub async fn list_models(
    State(ctx): State<ProxyContext>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, String)> {
    let profile = match profile_from_request(&ctx, &headers) {
        Ok(p) => p,
        Err(err) => {
            if let Some(t) = extract_gateway_token(&headers) {
                ctx.logger.push(
                    "warn",
                    "proxy",
                    format!("GET /v1/models rejected: invalid token *{}", token_tail(&t)),
                );
            } else {
                ctx.logger
                    .push("warn", "proxy", "GET /v1/models rejected: missing token");
            }
            return Err(err);
        }
    };

    let mut data = Vec::<Value>::new();
    for mapping in &profile.model_mappings {
        if mapping.claude_id.trim().is_empty() {
            continue;
        }
        let model_id = ensure_claude_prefix(&mapping.claude_id);
        data.push(json!({
            "id": model_id,
            "object": "model"
        }));
    }

    ctx.logger.push(
        "info",
        "proxy",
        format!("GET /v1/models ok ({} models)", data.len()),
    );

    Ok(Json(json!({
        "object": "list",
        "data": data
    })))
}

pub async fn forward_messages(
    State(ctx): State<ProxyContext>,
    headers: HeaderMap,
    Json(mut body): Json<Value>,
) -> Result<Response, (StatusCode, String)> {
    let profile = match profile_from_request(&ctx, &headers) {
        Ok(p) => p,
        Err(err) => {
            if let Some(t) = extract_gateway_token(&headers) {
                ctx.logger.push(
                    "warn",
                    "proxy",
                    format!("POST /v1/messages rejected: invalid token *{}", token_tail(&t)),
                );
            } else {
                ctx.logger
                    .push("warn", "proxy", "POST /v1/messages rejected: missing token");
            }
            return Err(err);
        }
    };

    let requested_model = body
        .get("model")
        .and_then(Value::as_str)
        .ok_or((StatusCode::BAD_REQUEST, "missing model".to_string()))?
        .to_string();
    let is_stream = body
        .get("stream")
        .and_then(Value::as_bool)
        .unwrap_or(false);

    let mapped = profile
        .model_mappings
        .iter()
        .find(|m| ensure_claude_prefix(&m.claude_id) == ensure_claude_prefix(&requested_model))
        .ok_or((
            StatusCode::BAD_REQUEST,
            format!("model '{}' is not configured in model_mappings", requested_model),
        ))?;

    let upstream_model = if mapped.upstream_id.trim().is_empty() {
        mapped.claude_id.trim().to_string()
    } else {
        mapped.upstream_id.trim().to_string()
    };
    body["model"] = json!(upstream_model.clone());

    ctx.logger.push(
        "info",
        "proxy",
        format!(
            "POST /v1/messages model '{}' -> upstream '{}'",
            requested_model, upstream_model
        ),
    );

    let base = profile.provider_base_url.trim_end_matches('/');
    let target = format!("{base}/v1/messages");

    let client = Client::new();
    let upstream = client
        .post(&target)
        .header(header::AUTHORIZATION, format!("Bearer {}", profile.api_key))
        .header(header::CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            let msg = e.to_string();
            ctx.logger
                .push("error", "proxy", format!("upstream request failed: {msg}"));
            (StatusCode::BAD_GATEWAY, msg)
        })?;

    let status = upstream.status();
    let content_type = upstream
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/json")
        .to_string();

    if is_stream || content_type.contains("text/event-stream") {
        ctx.logger.push(
            "info",
            "proxy",
            format!("POST /v1/messages streaming upstream status {}", status.as_u16()),
        );

        let stream = upstream.bytes_stream().map_err(std::io::Error::other);
        let mut response = Response::new(Body::from_stream(stream));
        *response.status_mut() = status;
        response.headers_mut().insert(
            header::CONTENT_TYPE,
            content_type
                .parse()
                .unwrap_or_else(|_| "text/event-stream".parse().expect("valid header")),
        );
        return Ok(response);
    }

    let bytes = upstream
        .bytes()
        .await
        .map_err(|e| {
            let msg = e.to_string();
            ctx.logger
                .push("error", "proxy", format!("read upstream response failed: {msg}"));
            (StatusCode::BAD_GATEWAY, msg)
        })?;

    ctx.logger.push(
        "info",
        "proxy",
        format!("POST /v1/messages upstream status {}", status.as_u16()),
    );

    let mut response = (status, bytes).into_response();
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        content_type
            .parse()
            .unwrap_or_else(|_| "application/json".parse().expect("valid header")),
    );
    Ok(response)
}
