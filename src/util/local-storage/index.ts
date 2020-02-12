export default {
  set(
      key: string,
      item: string,
      storageType: "local" | "session" = "local",
  ): void {
    const storageReference =
      storageType === "local" ? localStorage : sessionStorage
    const previousItem = storageReference.getItem(key)
    storageReference.setItem(key, item)
    if (previousItem == null) {
      console.log(`${storageType}Storage: an item was set:`, {[key]: item})
    } else {
      console.log(`${storageType}Storage: "${key}" was updated:`, {
        previousItem,
        newItem: item,
      })
    }
  },
  remove(key: string, storageType: "local" | "session" = "local"): void {
    (storageType === "local" ? localStorage : sessionStorage).removeItem(key)
    console.log(`${storageType}Storage: "${key}" was removed.`)
  },
}
