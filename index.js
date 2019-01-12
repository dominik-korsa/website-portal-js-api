const socketIO = require('socket.io-client');
const bcrypt = require('bcryptjs');

module.exports = class WebsitePortalAPI {
  connect(disconnectedCallback) {
    return new Promise((resolve, reject) => {
      this._io = socketIO("https://website-portal.herokuapp.com", {reconnection: false});
      // this._io = socketIO("http://localhost", {reconnection: false});

      this._io.on(`receiveUrl`, (url) => {
        this._receiveUrl(url);
      });

      this._io.on('connect', function() {
        resolve();
      });

      this._io.on('disconnect', function() {
        this._loggedIn = false;
        this._portalId = undefined;
        this._portalToken = undefined;

        if (disconnectedCallback) {
          disconnectedCallback();
        }
      });

      this._io.on('connect_error', function(error) {
        reject(error || new Error("Connection failed"));
      });
    });
  }

  register(platform, name) {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }
  
      this._io.emit('register', {platform, name}, (error, data) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }
        
        resolve(data);
      });
    });
  }

  login(id, token) {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }

      var tokenHash = bcrypt.hashSync(token, 8);

      this._io.emit('login', {id, token: tokenHash}, (error) => {
        if(error) {
          this._portalId = undefined;
          this._portalToken = undefined;

          reject(new Error(error.error));
          return;
        }

        this._portalId = id;
        this._portalToken = token;
        resolve();
      });
    });
  }

  getPairingCode() {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }

      this._io.emit('getPairingCode', (error, code) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }

        resolve(code);
      });
    });
  }

  resetPairingCode() {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }

      this._io.emit('resetPairingCode', (error, code) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }

        resolve(code);
      });
    });
  }

  removePairingCode() {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }

      this._io.emit('removePairingCode', (error) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }

        resolve();
      });
    });
  }

  getPairedPortalsData() {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }

      this._io.emit('getPairedPortalsData', (error, data) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }

        resolve(data);
      });
    });
  }

  rename(name) {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }
  
      this._io.emit('rename', name, (error) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }
        
        resolve();
      });
    });
  }

  pair(code) {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }
  
      this._io.emit('pair', code, (error) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }
        
        resolve();
      });
    });
  }

  sendUrl(id, url) {
    return new Promise((resolve, reject) => {
      if(!this.connected) {
        reject(new Error("Not connected"));
      }
  
      this._io.emit('sendUrl', id, url, (error) => {
        if(error) {
          reject(new Error(error.error));
          return;
        }
        
        resolve();
      });
    });
  }

  onUrl(callback) {
    if(typeof(callback) != "function") {
      throw new Error("Callback is not a function");
    }
    this._urlListeners.push(callback);
  }

  _receiveUrl(url) {
    this._urlListeners.forEach((element) => {
      element(url);
    });
  }

  constructor() {
    this._portalId = undefined;
    this._portalToken = undefined;
    this._loggedIn = false;
    this._io = undefined;
    this._urlListeners = [];
  }

  get connected() {
    return this._io?this._io.connected:false;
  }

  get loggedIn() {
    return this._loggedIn;
  }
}
