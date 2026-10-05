const databaseName = 'astitva-media'
const storeName = 'uploads'

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(databaseName,1)
    request.onupgradeneeded=()=>request.result.createObjectStore(storeName)
    request.onsuccess=()=>resolve(request.result)
    request.onerror=()=>reject(request.error)
  })
}

export async function saveMedia(file: File, key: string): Promise<void> {
  const database=await openMediaDatabase()
  await new Promise<void>((resolve,reject)=>{
    const transaction=database.transaction(storeName,'readwrite')
    transaction.objectStore(storeName).put(file,key)
    transaction.oncomplete=()=>resolve()
    transaction.onerror=()=>reject(transaction.error)
    transaction.onabort=()=>reject(transaction.error)
  })
  database.close()
}

export async function loadMedia(key: string): Promise<Blob | undefined> {
  const database=await openMediaDatabase()
  const blob=await new Promise<Blob|undefined>((resolve,reject)=>{
    const request=database.transaction(storeName,'readonly').objectStore(storeName).get(key)
    request.onsuccess=()=>resolve(request.result as Blob|undefined)
    request.onerror=()=>reject(request.error)
  })
  database.close()
  return blob
}
