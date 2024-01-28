<img src="https://user-images.githubusercontent.com/552629/76405509-87025300-6388-11ea-86c9-af882abb00bd.png" width="40" height="40" />

# SQLite compiled to JavaScript

[![CI status](https://github.com/sql-js/sql.js/workflows/CI/badge.svg)](https://github.com/sql-js/sql.js/actions)
[![npm](https://img.shields.io/npm/v/sql.js)](https://www.npmjs.com/package/sql.js)
[![CDNJS version](https://img.shields.io/cdnjs/v/sql.js.svg)](https://cdnjs.com/libraries/sql.js)

*sql.js* is a javascript SQL database. It allows you to create a relational database and query it entirely in the browser. You can try it in [this online demo](https://sql.js.org/examples/GUI/). It uses a [virtual database file stored in memory](https://emscripten.org/docs/porting/files/file_systems_overview.html), and thus **doesn't persist the changes** made to the database. However, it allows you to **import** any existing sqlite file, and to **export** the created database as a [JavaScript typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

*sql.js* uses [emscripten](https://emscripten.org/docs/introducing_emscripten/about_emscripten.html) to compile [SQLite](http://sqlite.org/about.html) to webassembly (or to javascript code for compatibility with older browsers). It includes [contributed math and string extension functions](https://www.sqlite.org/contrib?orderby=date).

sql.js can be used like any traditional JavaScript library. If you are building a native application in JavaScript (using Electron for instance), or are working in node.js, you will likely prefer to use [a native binding of SQLite to JavaScript](https://www.npmjs.com/package/sqlite3). A native binding will not only be faster because it will run native code, but it will also be able to work on database files directly instead of having to load the entire database in memory, avoiding out of memory errors and further improving performances.

SQLite is public domain, sql.js is MIT licensed.

## API documentation
A [full API documentation](https://sql.js.org/documentation/) for all the available classes and methods is available.
It is generated from comments inside the source code, and is thus always up to date.

## Usage
```javascript
await Nengw.addLib('sql.zip');
// Create a database
const db = await openSQL();
// NOTE: You can also use new SQL.Database(data) where
// data is an Uint8Array representing an SQLite database file


// Execute a single SQL string that contains multiple statements
let sqlstr = "CREATE TABLE hello (a int, b char); \
INSERT INTO hello VALUES (0, 'hello'); \
INSERT INTO hello VALUES (1, 'world');";
db.run(sqlstr); // Run the query without returning anything

// Prepare an sql statement
const stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

// Bind values to the parameters and fetch the results of the query
const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
console.log(result); // Will print {a:1, b:'world'}

// Bind other values
stmt.bind([0, 'hello']);
while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']
// free the memory used by the statement
stmt.free();
// You can not use your statement anymore once it has been freed.
// But not freeing your statements causes memory leaks. You don't want that.

const res = db.exec("SELECT * FROM hello");
/*
[
  {columns:['a','b'], values:[[0,'hello'],[1,'world']]}
]
*/

// You can also use JavaScript functions inside your SQL code
// Create the js function you need
function add(a, b) {return a+b;}
// Specifies the SQL function's name, the number of it's arguments, and the js function to use
db.create_function("add_js", add);
// Run a query in which the function is used
db.run("INSERT INTO hello VALUES (add_js(7, 3), add_js('Hello ', 'world'));"); // Inserts 10 and 'Hello world'

// You can create custom aggregation functions, by passing a name
// and a set of functions to `db.create_aggregate`:
//
// - an `init` function. This function receives no argument and returns
//   the initial value for the state of the aggregate function.
// - a `step` function. This function takes two arguments
//    - the current state of the aggregation
//    - a new value to aggregate to the state
//  It should return a new value for the state.
// - a `finalize` function. This function receives a state object, and
//   returns the final value of the aggregate. It can be omitted, in which case
//   the final value of the state will be returned directly by the aggregate function.
//
// Here is an example aggregation function, `json_agg`, which will collect all
// input values and return them as a JSON array:
db.create_aggregate(
  "json_agg",
  {
    init: () => [],
    step: (state, val) => [...state, val],
    finalize: (state) => JSON.stringify(state),
  }
);

db.exec("SELECT json_agg(column1) FROM (VALUES ('hello'), ('world'))");
// -> The result of the query is the string '["hello","world"]'

// Export the database to an Uint8Array containing the SQLite database file
const binaryArray = db.export();


      // Run a query without reading the results
      db.run("CREATE TABLE test (col1, col2);");
      // Insert two rows: (1,111) and (2,222)
      db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

      // Prepare a statement
      const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
      stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

      // Bind new values
      stmt.bind({$start:1, $end:2});
      while(stmt.step()) { //
        const row = stmt.getAsObject();
        console.log('Here is a row: ' + JSON.stringify(row));
      }
```


### Downloading/Using: ###
Although asm.js files were distributed as a single Javascript file, WebAssembly libraries are most efficiently distributed as a pair of files, the `.js`  loader and the `.wasm` file, like `sql-wasm.js` and `sql-wasm.wasm`. The `.js` file is responsible for loading the `.wasm` file. You can find these files on our [release page](https://github.com/sql-js/sql.js/releases)




## Versions of sql.js included in the distributed artifacts
You can always find the latest published artifacts on https://github.com/sql-js/sql.js/releases/latest.

For each [release](https://github.com/sql-js/sql.js/releases/), you will find a file called `sqljs.zip` in the *release assets*. It will contain:
 - `sql-wasm.js` : The Web Assembly version of Sql.js. Minified and suitable for production. Use this. If you use this, you will need to include/ship `sql-wasm.wasm` as well.
 - `sql-wasm-debug.js` : The Web Assembly, Debug version of Sql.js. Larger, with assertions turned on. Useful for local development. You will need to include/ship `sql-wasm-debug.wasm` if you use this.
 - `sql-asm.js` : The older asm.js version of Sql.js. Slower and larger. Provided for compatibility reasons.
 - `sql-asm-memory-growth.js` : Asm.js doesn't allow for memory to grow by default, because it is slower and de-optimizes. If you are using sql-asm.js and you see this error (`Cannot enlarge memory arrays`), use this file.
 - `sql-asm-debug.js` : The _Debug_ asm.js version of Sql.js. Use this for local development.
 - `worker.*` - Web Worker versions of the above libraries. More limited API. See [examples/GUI/gui.js](examples/GUI/gui.js) for a good example of this.

## Compiling/Contributing

General consumers of this library don't need to read any further. (The compiled files are available via the [release page](https://github.com/sql-js/sql.js/releases).)

If you want to compile your own version of SQLite for WebAssembly, or want to contribute to this project, see [CONTRIBUTING.md](CONTRIBUTING.md).
