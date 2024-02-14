pub trait StoreDef {
    fn postfix() -> u64;
}

pub struct Store<T: StoreDef> {
    store_def: T,
}

impl<T: StoreDef> Store<T> {
    pub fn new_with_store_def(store_def: T) -> Store<T> {
        Store::<T> { store_def }
    }
}
