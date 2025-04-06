use tauri::{command, State};
use zmq::Context;

#[command]
fn start_zmq_server() -> Result<String, String> {
    let context = Context::new();
    let socket = context.socket(zmq::REP).map_err(|e| e.to_string())?;

    // Bind the socket to a TCP address
    socket.bind("tcp://127.0.0.1:5555").map_err(|e| e.to_string())?;

    loop {
        let msg = socket.recv_string(0).map_err(|e| e.to_string())?;
        if let Some(msg) = msg {
            println!("Received message: {}", msg);
            socket.send("Hello from server", 0).map_err(|e| e.to_string())?;
        }
    }
    Ok("Server started".to_string())
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

      Ok(())
    })
    .plugin(tauri_plugin_websocket::init())
    .invoke_handler(generate_handler![start_zmq_server])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
