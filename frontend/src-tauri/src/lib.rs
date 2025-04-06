use tauri::{command, generate_handler, WebviewWindowBuilder, WebviewUrl, TitleBarStyle};
use serde::{Serialize, Deserialize};

use std::thread;
use std::time::Duration;
use zmq;
use tauri::AppHandle;
use tauri::Emitter;
use base64::engine::general_purpose::STANDARD as base64;
use base64::Engine;

#[derive(Serialize, Deserialize)]
struct ZmqResponse {
    message: String,
}

#[command]
fn send_zmq_message(message: String) -> Result<String, String> {
    let context = zmq::Context::new();
    let socket = context.socket(zmq::REQ).unwrap();
    
    // Set timeouts
    socket.set_linger(0).unwrap();
    socket.set_rcvtimeo(2000).unwrap();
    socket.set_sndtimeo(2000).unwrap();
    
    // Connect to Java server
    if let Err(e) = socket.connect("tcp://127.0.0.1:5555") {
        return Err(format!("Failed to connect: {}", e));
    }
    
    // Send message
    if let Err(e) = socket.send(message.as_bytes(), 0) {
        return Err(format!("Failed to send: {}", e));
    }

    println!("Sent message: {}", message);
    
    // Get response
    let mut response = zmq::Message::new();
    match socket.recv(&mut response, 0) {
        Ok(_) => {
            let response_str = String::from_utf8_lossy(&response).to_string();
            Ok(response_str)
        },
        Err(e) => Err(format!("Failed to receive: {}", e))
    }
}

fn start_zmq_receiver(app_handle: AppHandle) {
  thread::spawn(move || {
    let context = zmq::Context::new();
    let subscriber = context.socket(zmq::SUB).expect("Failed to create socket");
    subscriber.connect("tcp://127.0.0.1:5555").expect("Connect failed");
    subscriber.set_subscribe(b"IMAGE").expect("Subscribe failed");

    loop {
        let _topic = subscriber.recv_string(0).unwrap();
        let img_bytes = subscriber.recv_bytes(0).unwrap();

        // Base64 encode the image bytes to send to frontend
        let base64_img = base64.encode(&img_bytes);

        // Send to frontend
        // println!("Received image bytes, emitting event");
        app_handle.emit("image-frame", base64_img).unwrap();

        thread::sleep(Duration::from_millis(100)); // ~10 fps
    }
});
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .setup(|app| {
      let win_builder =
        WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
          .title(" ")
          .inner_size(800.0, 600.0);

      // set transparent title bar only when building for macOS
      #[cfg(target_os = "macos")]
      let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

      let window = win_builder.build().unwrap();

      // set background color only when building for macOS
      #[cfg(target_os = "macos")]
      {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
          let bg_color = NSColor::colorWithRed_green_blue_alpha_(
              nil,
              38.0 / 255.0,
              38.0 / 255.0,
              38.0 / 255.0,
              1.0,
          );
          ns_window.setBackgroundColor_(bg_color);
        }
      }

      let app_handle = app.handle();

      // app_handle.listen("frontend-ready", move |_| {
      println!("Frontend ready, starting ZMQ stream...");
      start_zmq_receiver(app_handle.clone());
      // });

      Ok(())
    })
    .plugin(tauri_plugin_websocket::init())
    .invoke_handler(generate_handler![send_zmq_message])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
