## Rust Addons for Hubble Core
This directory contains the addon code for Hubble core. It uses neon to call from NodeJS into Rust. The rust library is compiled into the binary file `index.node` (see `Cargo.toml` and `package.json`) and copied into the `addon` folder. This can then be imported into a TS file like a normal JS import (see `rustfunctions.ts`)

### Setting up vscode
If you open the root folder or `packages/core` folder in vscode, vscode will treat the entire project as a typescript project and not activate the rust plugins (like `rust-analyzer`). To make vscode load the rust plugins, you need to File -> Add folder to workspace -> navigate to packages/core/src/addon. This will add the `addon` folder to the workspace and let you use the Typescript and Rust vscode plugins side-by-side. 

### Validations
The Rust code links the snapchain rust validations and exposes them as js methods.
