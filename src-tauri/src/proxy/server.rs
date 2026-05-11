use std::net::SocketAddr;
use std::sync::Arc;

use axum::routing::{get, post};
use axum::Router;
use tokio::sync::{oneshot, Mutex};

use crate::config::store::ConfigStore;

use super::handlers;

#[derive(Default)]
struct Runtime {
    running: bool,
    port: u16,
    shutdown_tx: Option<oneshot::Sender<()>>,
}

#[derive(Clone)]
pub struct ProxyServer {
    store: Arc<ConfigStore>,
    runtime: Arc<Mutex<Runtime>>,
}

impl ProxyServer {
    pub fn new(store: Arc<ConfigStore>) -> Self {
        Self {
            store,
            runtime: Arc::new(Mutex::new(Runtime::default())),
        }
    }

    pub async fn start(&self, port: u16) -> Result<(), String> {
        let mut rt = self.runtime.lock().await;
        if rt.running {
            return Ok(());
        }

        let app = Router::new()
            .route("/v1/models", get(handlers::list_models))
            .route("/v1/messages", post(handlers::forward_messages))
            .with_state(self.store.clone());

        let (tx, rx) = oneshot::channel::<()>();
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .map_err(|e| e.to_string())?;

        tokio::spawn(async move {
            let _ = axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    let _ = rx.await;
                })
                .await;
        });

        rt.running = true;
        rt.port = port;
        rt.shutdown_tx = Some(tx);
        Ok(())
    }

    pub async fn stop(&self) {
        let mut rt = self.runtime.lock().await;
        if let Some(tx) = rt.shutdown_tx.take() {
            let _ = tx.send(());
        }
        rt.running = false;
    }

    pub async fn status(&self) -> (bool, u16) {
        let rt = self.runtime.lock().await;
        (rt.running, rt.port)
    }
}
