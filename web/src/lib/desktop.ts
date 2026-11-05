/**
 * 桌面壳检测与原生能力。
 *
 * Web 版继续使用 Blob 下载；Tauri 直接把备份写到用户选择的路径，
 * 不依赖 WebView2 对 `<a download>` 的实现。
 */

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 打开原生保存对话框并写入文本。返回最终路径；用户取消时返回 null。
 * 仅在 Tauri 环境调用。
 */
export async function saveTextFile(filename: string, contents: string): Promise<string | null> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<string | null>('save_backup', { filename, contents })
}
