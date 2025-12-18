/**
 * Remove unused IndexedDB databases whose names match known legacy patterns.
 *
 * Deletes any database whose name:
 * - ends with `:server-clock`
 * - ends with `:sync-metadata`
 * - starts with `idx:` and ends with `:block` or `:doc`
 * - starts with `jp:`
 *
 * If IndexedDB is not available in the environment the function does nothing.
 * If retrieving the list of databases fails, an error is logged to the console.
 */
function cleanupUnusedIndexedDB() {
  const indexedDB = window.indexedDB;
  if (!indexedDB) {
    return;
  }

  indexedDB
    .databases()
    .then(databases => {
      databases.forEach(database => {
        if (database.name?.endsWith(':server-clock')) {
          indexedDB.deleteDatabase(database.name);
        }
        if (database.name?.endsWith(':sync-metadata')) {
          indexedDB.deleteDatabase(database.name);
        }
        if (
          database.name?.startsWith('idx:') &&
          (database.name.endsWith(':block') || database.name.endsWith(':doc'))
        ) {
          indexedDB.deleteDatabase(database.name);
        }
        if (database.name?.startsWith('jp:')) {
          indexedDB.deleteDatabase(database.name);
        }
      });
    })
    .catch(error => {
      console.error('Failed to cleanup unused IndexedDB databases:', error);
    });
}

cleanupUnusedIndexedDB();