use anyhow::Error;
use fluentci_pdk::dag;

pub fn get_os_arch() -> Result<String, Error> {
    let os = dag().get_os()?;
    let arch = dag().get_arch()?;

    match os.as_str() {
        "linux" => match arch.as_str() {
            "x86_64" => Ok("x86_64-unknown-linux-gnu".into()),
            _ => Err(Error::msg("Unsupported architecture").into()),
        },
        "macos" => match arch.as_str() {
            "x86_64" => Ok("x86_64-apple-darwin".into()),
            "aarch64" => Ok("aarch64-apple-darwin".into()),
            _ => Err(Error::msg("Unsupported architecture").into()),
        },
        _ => Err(Error::msg("Unsupported OS").into()),
    }
}

pub fn setup_wasix() -> Result<(), Error> {
    dag().call(
        "https://pkg.fluentci.io/rust_pipeline@v0.10.2?wasm=1",
        "setup",
        vec![],
    )?;

    let wasix_ok = dag()
        .directory(".")?
        .with_exec(vec!["type cargo-wasix > /dev/null 2>&1 || echo KO"])?
        .stdout()?;

    if !wasix_ok.contains("KO") {
        return Ok(());
    }

    let mut cargo_wasix_version = dag().get_env("CARGO_WASIX_VERSION").unwrap_or_default();

    if cargo_wasix_version.is_empty() {
        cargo_wasix_version = "v0.1.23".into();
    }

    let os_arch = get_os_arch()?;

    dag()
        .pkgx()?
        .with_packages(vec!["curl", "wget", "tar"])?
        .with_exec(vec!["wget", &format!("https://github.com/wasix-org/cargo-wasix/releases/download/{}/cargo-wasix-{}.tar.xz", cargo_wasix_version, os_arch)])?
        .with_exec(vec!["tar", "-xvf", &format!("cargo-wasix-{}.tar.xz", os_arch)])?
        .with_exec(vec![&format!("mv cargo-wasix-{}/cargo-wasix $HOME/.cargo/bin", os_arch)])?
        .with_exec(vec!["rm -rf cargo-wasix-*"])?
        .with_exec(vec![&format!("wget https://github.com/wasix-org/rust/releases/download/v2023-11-01.1/rust-toolchain-{}.tar.gz", os_arch)])?
        .with_exec(vec![&format!("mkdir rust-toolchain-{} && cd rust-toolchain-{} && tar -xvf ../rust-toolchain-{}.tar.gz", os_arch, os_arch, os_arch)])?
        .with_exec(vec![&format!("wget https://github.com/wasix-org/rust/releases/download/v2023-11-01.1/wasix-libc.tar.gz")])?
        .with_exec(vec!["mkdir wasix-libc && cd wasix-libc && tar -xvf ../wasix-libc.tar.gz"])?
        .with_exec(vec![&format!("mkdir -p $HOME/.local/share/cargo-wasix/{}_v2023-11-01.1", os_arch)])?
        .with_exec(vec![&format!("mv rust-toolchain-{} $HOME/.local/share/cargo-wasix/{}_v2023-11-01.1/rust", os_arch, os_arch)])?
        .with_exec(vec!["mv", "wasix-libc", &format!("$HOME/.local/share/cargo-wasix/{}_v2023-11-01.1/wasix-libc", os_arch)])?
        .with_exec(vec![
          "rustup",
          "toolchain",
          "link",
          "wasix",
          &format!("$HOME/.local/share/cargo-wasix/{}_v2023-11-01.1/rust", os_arch),
        ])?
        .with_exec(vec![
          "chmod",
          "a+x",
          &format!("$HOME/.local/share/cargo-wasix/{}_v2023-11-01.1/rust/bin/*", os_arch),
          &format!("$HOME/.local/share/cargo-wasix/{}_v2023-11-01.1/rust/lib/rustlib/{}/bin/*", os_arch, os_arch),
        ])?
        .with_exec(vec!["cp", &format!("$HOME/.rustup/toolchains/stable-{}/bin/cargo", os_arch), "$HOME/.rustup/toolchains/wasix/bin"])?
        .stdout()?;
    Ok(())
}

pub fn setup_wasmer() -> Result<(), Error> {
    let wasmer_dir = dag().get_env("WASMER_DIR").unwrap_or_default();

    if !wasmer_dir.is_empty() {
        return Ok(());
    }

    let path = dag().get_env("PATH").unwrap_or_default();
    let home = dag().get_env("HOME").unwrap_or_default();
    let wasmer_dir = format!("{}/.wasmer", home);

    dag().set_envs(vec![
        ("WASMER_DIR".into(), wasmer_dir.clone()),
        ("WASMER_CACHE_DIR".into(), format!("{}/cache", wasmer_dir)),
        ("PATH".into(), format!("{}/bin:{}", wasmer_dir, path)),
    ])?;

    dag()
        .pkgx()?
        .with_packages(vec!["curl"])?
        .with_exec(vec!["curl https://get.wasmer.io -sSfL | sh"])?
        .stdout()?;

    Ok(())
}
