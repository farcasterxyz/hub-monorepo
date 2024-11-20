## Rust Addons for Hubble
This directory contains the addon code for Hubble. It uses neon to call from NodeJS into Rust. The rust library is compiled into the binary file `index.node` (see `Cargo.toml` and `package.json`) and copied into the `addon` folder. This can then be imported into a TS file like a normal JS import (see `rustfunctions.ts`)

### Setting up vscode
If you open the root folder or `apps/hubble` folder in vscode, vscode will treat the entire project as a typescript project and not activate the rust plugins (like `rust-analyzer`). To make vscode load the rust plugins, you need to File -> Add folder to workspace -> navigate to apps/hubble/src/addon. This will add the `addon` folder to the workspace and let you use the Typescript and Rust vscode plugins side-by-side. 

### DB
The Rust code hosts the RocksDB, and the NodeJS code calls into the rust `rocksdb.rs` for all DB operations. 

### CRDT Store
Currently, the reaction store is hosted in Rust. It contains the code for merging CRDT messages.

### Note about ownership
All rust objects need to be "owned" by someone so that rust can manage its lifecycle. For rust objects like the `RocksDb` and the `ReactionStore`, we create them as `JsBox<Arc<T>>`. `JsBox` is like Rust's `Box`, except it is owned by the Javascript pointer that is returned. That is, 
- The DB object is owned by the Javascript object that is returned
- When the Javascript object goes out of scope and is gc'd, it is `drop()`-ed in Rust. 

Since the Rust objects are `Arc<T>` inside a `JsBox`, we can clone them and keep them around in the rust code as we please, since the Javascript code will continue to own one `Arc<T>`, making sure that it lasts for the lifetime of the program.

### Note about iterators
Rust code needs to be memory-safe, which means that we can't pass around iterators like we do in Javascript. This is because the `iterator` reference is valid for only as long as the `db` is valid, and the reference is dropped right after the iterator is finished.

This specifically means that we need to use iterators as callbacks. The way the iterators are set up is:
- Call the `forEachIterator` method with your callback (Either in JS or Rust)
- Perform all actions in the callback
- At the end of the iteration, the iterator is returned and closed by Rust

#### Iterators and paging
In JS, we can have async functions as callbacks to the `forEachIterator` methods. This means that the callback can take arbitrarily long, and that is bad because keeping iterators open for long periods of time is very problematic (See section below). Additionally, we can't call async JS methods from rust. To address both of these, the iterators are automatically paged. 

That means that when you start an iterator:
1. JS code will fetch a page full of keys and values from rust
2. Close the iterator right after. 
3. Calls the async callbacks with the cached key, value pairs, which can take as long as needed. 
4. Go back to step 1 to get the next page of key, value pairs. 

This should be handled transparently from JS. 

#### Keeping iterators open for long periods is bad
Keeping RocksDB iterators open for long periods can lead to several issues that negatively impact the performance and stability. 

Firstly, RocksDB iterators hold resources and locks internally to maintain a consistent view of the data as it was at the time the iterator was created. Holding these resources for an extended time can lead to increased memory usage and limit the database's ability to efficiently manage and compact data. This behavior can significantly slow down read and write operations, leading to performance degradation over time. 

Furthermore, long-lived iterators can prevent the database from reclaiming space associated with deleted or overwritten entries, as the iterator may still reference these obsolete data points. 

Additionally, keeping iterators open across multiple database updates can result in stale data being read, as the iterator does not automatically refresh to reflect changes made to the database after its creation. This can lead to inconsistencies and logic errors within the application relying on up-to-date data. 
