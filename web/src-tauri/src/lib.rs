use tauri::webview::{PermissionKind, PermissionResponse};
use tauri_plugin_dialog::DialogExt;

/// 打开原生保存对话框并写入备份 JSON。
///
/// Web 版用 Blob 下载；桌面壳里 WebView2 的 `<a download>` 行为不稳定，
/// 所以导出走 Tauri 命令。返回最终路径，用户取消时返回 `None`。
#[tauri::command]
async fn save_backup(
    app: tauri::AppHandle,
    filename: String,
    contents: String,
) -> Result<Option<String>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("导出脱口备份")
        .set_file_name(filename.as_str())
        .add_filter("JSON 备份", &["json"])
        .blocking_save_file();

    match selected {
        Some(path) => {
            let path = path.into_path().map_err(|error| error.to_string())?;
            std::fs::write(&path, contents).map_err(|error| error.to_string())?;
            Ok(Some(path.to_string_lossy().into_owned()))
        }
        None => Ok(None),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // 口语评测需要 getUserMedia；WebView2 默认会弹原生权限框或拒绝。
        // 只放行麦克风，其余权限继续走平台默认行为。
        .on_permission_request(|_webview, kind| match kind {
            PermissionKind::Microphone => PermissionResponse::Allow,
            _ => PermissionResponse::Default,
        })
        .invoke_handler(tauri::generate_handler![save_backup])
        .run(tauri::generate_context!())
        .expect("error while running blurt");
}
