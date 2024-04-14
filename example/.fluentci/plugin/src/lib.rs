use extism_pdk::*;
use fluentci_pdk::dag;

use crate::helpers::{setup_wasix, setup_wasmer};

pub mod helpers;

#[plugin_fn]
pub fn setup() -> FnResult<String> {
    setup_wasix()?;
    setup_wasmer()?;
    Ok("Setup complete".to_string())
}

#[plugin_fn]
pub fn build(args: String) -> FnResult<String> {
    setup_wasix()?;
    setup_wasmer()?;
    let stdout = dag()
        .pipeline("build")?
        .with_exec(vec![
            "PATH=$HOME/.cargo/bin:$PATH",
            "cargo",
            "wasix",
            "build",
            "--release",
            &args,
        ])?
        .stdout()?;
    Ok(stdout)
}

#[plugin_fn]
pub fn deploy(args: String) -> FnResult<String> {
    setup_wasmer()?;
    let stdout = dag()
        .pipeline("deploy")?
        .with_exec(vec!["wasmer", "deploy", "--non-interactive", &args])?
        .stdout()?;
    Ok(stdout)
}
