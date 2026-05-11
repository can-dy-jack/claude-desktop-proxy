use std::sync::Arc;

use axum::extract::State;
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use reqwest::Client;
use serde_json::{json, Value};

use crate::config::store::{ConfigStore, Profile};

fn active_profile(store: &ConfigStore) -> Result<Profile, (StatusCode, String)> {
    store
        .active_profile()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?
        .ok_or((StatusCode::BAD_REQUEST, "no active profile".to_string()))
}

fn check_token(headers: &HeaderMap, expected_token: &str) -> Result<(), (StatusCode, String)> {
    let auth = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();
    let expected = format!("Bearer {expected_token}");
    if auth == expected {
        Ok(())
    } else {
        Err((StatusCode::UNAUTHORIZED, "invalid token".to_string()))
    }
}

pub async fn list_models(
    State(store): State<Arc<ConfigStore>>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, String)> {
    let profile = active_profile(&store)?;
    check_token(&headers, &profile.gateway_token)?;

    let data: Vec<Value> = profile
        .model_mappings
        .iter()
        .map(|m| {
            json!({
                "type": "model",
                "id": m.claude_id,
                "display_name": m.display_name.clone().unwrap_or_else(|| m.claude_id.clone()),
                "created_at": "2024-01-01T00:00:00Z"
            })
        })
        .collect();

    Ok(Json(json!({
        "data": data,
        "has_more": false,
        "first_id": data.first().and_then(|m| m.get("id")).cloned().unwrap_or(Value::Null),
        "last_id": data.last().and_then(|m| m.get("id")).cloned().unwrap_or(Value::Null)
    })))
}

pub async fn forward_messages(
    State(store): State<Arc<ConfigStore>>,
    headers: HeaderMap,
    Json(mut body): Json<Value>,
) -> Result<Response, (StatusCode, String)> {
    let profile = active_profile(&store)?;
    check_token(&headers, &profile.gateway_token)?;

    let requested_model = body
        .get("model")
        .and_then(Value::as_str)
        .ok_or((StatusCode::BAD_REQUEST, "missing model".to_string()))?;

    let mapped = profile
        .model_mappings
        .iter()
        .find(|m| m.claude_id == requested_model)
        .ok_or((StatusCode::BAD_REQUEST, "model mapping not found".to_string()))?;

    body["model"] = json!(mapped.upstream_id);

    let base = profile.provider_base_url.trim_end_matches('/');
    let target = format!("{base}/v1/messages");

    let client = Client::new();
    let upstream = client
        .post(target)
        .header(header::AUTHORIZATION, format!("Bearer {}", profile.api_key))
        .header(header::CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    let status = upstream.status();
    let content_type = upstream
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/json")
        .to_string();

    let bytes = upstream
        .bytes()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    let mut response = (status, bytes).into_response();
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        content_type
            .parse()
            .unwrap_or_else(|_| "application/json".parse().expect("valid header")),
    );
    Ok(response)
}
