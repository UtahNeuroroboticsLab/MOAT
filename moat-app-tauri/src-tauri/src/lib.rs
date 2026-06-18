use std::fs;
use std::path::PathBuf;

fn moat_data_dir() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe.parent().ok_or_else(|| "Cannot determine executable directory".to_string())?;
    Ok(exe_dir.join("MOAT_data"))
}

#[tauri::command]
fn ensure_data_dirs() -> Result<String, String> {
    let base = moat_data_dir()?;
    fs::create_dir_all(base.join("assessments")).map_err(|e| e.to_string())?;
    fs::create_dir_all(base.join("patient_data")).map_err(|e| e.to_string())?;
    Ok(base.to_string_lossy().to_string())
}

#[tauri::command]
fn save_assessment(filename: String, json: String) -> Result<(), String> {
    let path = moat_data_dir()?.join("assessments").join(&filename);
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_assessments() -> Result<Vec<String>, String> {
    let dir = moat_data_dir()?.join("assessments");
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    let mut names: Vec<String> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .filter(|n| n.ends_with(".json"))
        .collect();
    names.sort();
    Ok(names)
}

#[tauri::command]
fn load_assessment(filename: String) -> Result<String, String> {
    let path = moat_data_dir()?.join("assessments").join(&filename);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_patient_data(patient_id: String, json: String) -> Result<(), String> {
    let path = moat_data_dir()?.join("patient_data").join(format!("{}.json", patient_id));
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_patient_data(patient_id: String) -> Result<Option<String>, String> {
    let path = moat_data_dir()?.join("patient_data").join(format!("{}.json", patient_id));
    if path.exists() {
        Ok(Some(fs::read_to_string(path).map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ensure_data_dirs,
            save_assessment,
            list_assessments,
            load_assessment,
            save_patient_data,
            load_patient_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
