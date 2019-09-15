* where is exp8266's RXD1 pin?
* why use of  async methods in PikachuBotPeripheral gives weird exception (see commit #)
```
    peripheral.js:90 Uncaught ReferenceError: regeneratorRuntime is not defined
    at peripheral.js:90
    at peripheral.js:90
    at Module.<anonymous> (peripheral.js:90)
    at Module../node_modules/scratch-vm/src/extensions/pikachubot/peripheral.js (peripheral.js:90)
    at __webpack_require__ (bootstrap:84)
    at Module../node_modules/scratch-vm/src/extensions/pikachubot/index.js (custom-link-socket.js:5)
    at __webpack_require__ (bootstrap:84)
    at Object.pikachubot (extension-manager.js:27)
    at ExtensionManager.loadExtensionURL (extension-manager.js:152)
    at ExtensionLibrary.handleItemSelect (extension-library.jsx:43)
```