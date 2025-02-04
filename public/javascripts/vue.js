/* eslint-disable no-console */
/* global Vue */

const vueinst = new Vue({
    el: "#myNavBar",
    data: {
      website: '/login.html',
      butttonTag: 'Login',
      serverLoginFlag: false,
      serverAdminFlag: false,
      serverManagerFlag: false
    },
    created: function () {
      fetch('/api/loginFlag')
        .then(response => response.json())
        .then(data => {
          this.serverLoginFlag = data.loginFlag;
          if (this.serverLoginFlag == 'true' || this.serverLoginFlag === true) {
            this.butttonTag = 'Sign out';
          }
        });

      fetch('/api/adminFlag')
        .then(response => response.json())
        .then(data => {
          this.serverAdminFlag = data.adminFlag;
        });

      fetch('/api/managerFlag')
        .then(response => response.json())
        .then(data => {
          this.serverManagerFlag = data.managerFlag;
        });
    },
    methods: {
      logout: function() {
        fetch('/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            this.serverLoginFlag = false;
            this.serverAdminFlag = false;
            this.serverManagerFlag = false;
            this.butttonTag = 'Login';
            window.location.href = 'index.html'; // Redirect to index.html
          }
        })
        .catch(error => {
          console.error('Error logging out:', error);
        });
      }
    }
  });


  const vueinst2 = new Vue({
    el: "#hideFunctions",
    data: {
        name: 'name',
        role: 'User',
        serverAdminFlag: false,
        serverManagerFlag: false
    },
    created: function () {
        fetch('/api/adminFlag')
            .then(response => response.json())
            .then(data => {
                this.serverAdminFlag = data.adminFlag;
                this.name = data.userName;
                if (this.serverAdminFlag){
                    this.role = 'Admin';
                }
            });

        fetch('/api/managerFlag')
            .then(response => response.json())
            .then(data => {
                this.serverManagerFlag = data.managerFlag;
                this.name = data.userName;
                if (this.serverManagerFlag){
                    this.role = 'Manager';
                }
            });
    },
    methods: {

    }
});

const vueinst3 = new Vue({
    el: "#main-content",
    data: {
        name: 'name',
        role: 'User',
        serverAdminFlag: false,
        serverManagerFlag: false
    },
    created: function () {
        fetch('/api/adminFlag')
            .then(response => response.json())
            .then(data => {
                this.serverAdminFlag = data.adminFlag;
                this.name = data.userName;
                if (this.serverAdminFlag){
                    this.role = 'Admin';
                }
            });

        fetch('/api/managerFlag')
            .then(response => response.json())
            .then(data => {
                this.serverManagerFlag = data.managerFlag;
                this.name = data.userName;
                if (this.serverManagerFlag){
                    this.role = 'Manager';
                }
            });
    },
    methods: {

    }
});



