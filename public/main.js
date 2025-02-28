function handleResponsiveDisplay() {
    const userPhoto = document.getElementById('userPhoto');
    const userName = document.getElementById('userName');

    if (window.innerWidth <= 600) {
        userPhoto.style.display = 'none';
        userName.style.display = 'none';
    } else {
        userPhoto.style.display = 'block';
        userName.style.display = 'inline-block';
    }
}

// Cek saat halaman dimuat
handleResponsiveDisplay();

// Pantau perubahan ukuran layar
window.addEventListener('resize', handleResponsiveDisplay);


// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAef7qSseJeQkjYZGYuNmGZCqkcWzA05I0",
    authDomain: "work-tracker-bc2d4.firebaseapp.com",
    databaseURL: "https://work-tracker-bc2d4-default-rtdb.firebaseio.com",
    projectId: "work-tracker-bc2d4",
    storageBucket: "work-tracker-bc2d4.firebasestorage.app",
    messagingSenderId: "185613968614",
    appId: "1:185613968614:web:439658239bc71ec2640727",
    measurementId: "G-11R7H9G6S9"
  };
  
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const database = firebase.database();
  let currentUser = null;
  
  // Format and parse functions for Indonesian Rupiah
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
  
  function parseRupiahInput(input) {
    // Remove all dots and convert to number
    return parseFloat(input.replace(/\./g, '')) || 0;
  }
  
  // Apply Rupiah input formatting to input elements
  function applyRupiahInputFormatting(inputElement) {
    inputElement.addEventListener('input', function(e) {
      // Get input value and remove any non-digits
      let value = this.value.replace(/\D/g, '');
      
      // Format with dots for thousands
      if (value !== '') {
        value = parseInt(value, 10).toLocaleString('id-ID').replace(/,/g, '.');
      }
      
      // Update the input value
      this.value = value;
    });
  }
  
  // Apply formatting to all currency input fields
  function initializeRupiahInputs() {
    const rupiahInputs = [
      'fareAmount', 'paymentAmount', 
      'initialBalance', 'totalOrders', 'cashPayments',
      'expenseAmount'
    ];
    
    rupiahInputs.forEach(id => {
      const inputElement = document.getElementById(id);
      if (inputElement) {
        applyRupiahInputFormatting(inputElement);
      }
    });
  }
  
  // Check authentication
  auth.onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      currentUser = user;
      updateUserProfile(user);
      loadUserData();
      initializeRupiahInputs();
    } else {
      // User is signed out, redirect to login
      window.location.href = '/';
    }
  });
  
  function updateUserProfile(user) {
    const userNameElement = document.getElementById('userName');
    const userPhotoElement = document.getElementById('userPhoto');
    
    // Set user name
    userNameElement.textContent = user.displayName || user.email;
    userNameElement.classList.remove('hidden');
    
    // Set user photo if available, otherwise use default
    if (user.photoURL) {
      userPhotoElement.src = user.photoURL;
    } else {
      // Gunakan avatar default
      userPhotoElement.src = '/images/default-avatar.png'; // Sesuaikan path gambar default
    }
    userPhotoElement.classList.remove('hidden');
    
    // Update profile section if it exists
    updateProfileSection(user);
  }
  
  function updateProfileSection(user) {
    const profileNameElement = document.getElementById('profileName');
    const profileEmailElement = document.getElementById('profileEmail');
    const profilePhotoElement = document.getElementById('profilePhoto');
    
    if (profileNameElement && profileEmailElement && profilePhotoElement) {
      profileNameElement.textContent = user.displayName || 'User';
      profileEmailElement.textContent = user.email || '';
      
      // Set profile photo with fallback to default
      if (user.photoURL) {
        profilePhotoElement.src = user.photoURL;
      } else {
        profilePhotoElement.src = '/img/user.jpg'; // Sesuaikan path gambar default
      }
      profilePhotoElement.classList.remove('hidden');
    }
  }
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', function() {
    auth.signOut().then(() => {
      window.location.href = '/';
    }).catch((error) => {
      console.error("Logout error:", error);
      showAlert("Gagal keluar dari sistem. Silakan coba lagi.", "error");
    });
  });
  
  // Navigation
  document.getElementById('navPayment').addEventListener('click', function() {
    showSection('paymentSection');
    updateNavActiveState('navPayment');
  });
  
  document.getElementById('navBalance').addEventListener('click', function() {
    showSection('balanceSection');
    updateNavActiveState('navBalance');
    loadBalanceHistory();
  });
  
  document.getElementById('navExpense').addEventListener('click', function() {
    showSection('expenseSection');
    updateNavActiveState('navExpense');
    loadExpenses();
  });
  
  document.getElementById('navProfile').addEventListener('click', function() {
    showSection('profileSection');
    updateNavActiveState('navProfile');
  });
  
  function showSection(sectionId) {
    const sections = ['paymentSection', 'balanceSection', 'expenseSection', 'profileSection'];
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        section.classList.add('hidden');
      }
    });
    document.getElementById(sectionId).classList.remove('hidden');
  }
  
  function updateNavActiveState(activeNavId) {
    const navItems = ['navPayment', 'navBalance', 'navExpense', 'navProfile'];
    navItems.forEach(id => {
      const navElem = document.getElementById(id);
      if (navElem) {
        if (id === activeNavId) {
          navElem.classList.replace('text-gray-600', 'text-blue-600');
        } else {
          navElem.classList.replace('text-blue-600', 'text-gray-600');
        }
      }
    });
  }
  
  // Payment Calculator
  document.getElementById('calculateChangeBtn').addEventListener('click', function() {
    const fare = parseRupiahInput(document.getElementById('fareAmount').value);
    const payment = parseRupiahInput(document.getElementById('paymentAmount').value);
    const change = payment - fare;
    
    document.getElementById('changeAmount').value = formatCurrency(change);
    
    // Show success message
    if (change >= 0) {
      showAlert(`Kembalian: Rp ${formatCurrency(change)}`, "success");
    } else {
      showAlert(`Pembayaran kurang: Rp ${formatCurrency(Math.abs(change))}`, "warning");
    }
  });
  
  // Balance Calculator
  document.getElementById('calculateBalanceBtn').addEventListener('click', function() {
    const initialBalance = parseRupiahInput(document.getElementById('initialBalance').value);
    const totalOrders = parseRupiahInput(document.getElementById('totalOrders').value);
    const cashPayments = parseRupiahInput(document.getElementById('cashPayments').value);
    
    // Required balance calculation
    const requiredBalance = totalOrders - cashPayments;
    
    // Net earnings calculation
    const netEarnings = cashPayments - (initialBalance - requiredBalance);
    
    document.getElementById('requiredBalance').value = formatCurrency(requiredBalance);
    document.getElementById('netEarnings').value = formatCurrency(netEarnings);
    
    // Save to database
    if (currentUser) {
      const balanceData = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        initialBalance,
        totalOrders,
        cashPayments,
        requiredBalance,
        netEarnings
      };
      
      database.ref(`users/${currentUser.uid}/balanceHistory`).push(balanceData)
        .then(() => {
          console.log("Balance data saved successfully");
          showAlert("Data saldo berhasil disimpan", "success");
          loadBalanceHistory();
        })
        .catch((error) => {
          console.error("Error saving balance data:", error);
          showAlert("Gagal menyimpan data saldo", "error");
        });
    }
  });
  
  // Load Balance History
  function loadBalanceHistory() {
    if (!currentUser) return;
    
    const balanceHistoryList = document.getElementById('balanceHistoryList');
    if (!balanceHistoryList) return;
    
    // Clear list
    balanceHistoryList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Memuat riwayat saldo...</p>';
    
    // Get balance history from database
    database.ref(`users/${currentUser.uid}/balanceHistory`)
      .orderByChild('timestamp')
      .limitToLast(15) // Limit to last 15 records
      .once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          let history = [];
          
          snapshot.forEach((childSnapshot) => {
            const record = childSnapshot.val();
            record.id = childSnapshot.key;
            history.push(record);
          });
          
          // Sort history by date (most recent first)
          history.sort((a, b) => b.timestamp - a.timestamp);
          
          // Display history
          if (history.length > 0) {
            balanceHistoryList.innerHTML = '';
            history.forEach(record => {
              const recordEl = document.createElement('div');
              recordEl.className = 'mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200';
              recordEl.innerHTML = `
                <div class="flex justify-between items-center">
                  <p class="font-medium">Tanggal: ${formatDate(record.date || new Date(record.timestamp).toISOString().split('T')[0])}</p>
                  <button class="text-red-500 delete-balance-btn" data-id="${record.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <p class="text-gray-600">Modal Awal:</p>
                    <p>Rp ${formatCurrency(record.initialBalance)}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Total Pesanan:</p>
                    <p>Rp ${formatCurrency(record.totalOrders)}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Pembayaran Tunai:</p>
                    <p>Rp ${formatCurrency(record.cashPayments)}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Modal Diperlukan:</p>
                    <p class="${record.requiredBalance < 0 ? 'text-red-600' : ''}">Rp ${formatCurrency(record.requiredBalance)}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-gray-600">Pendapatan Bersih:</p>
                    <p class="${record.netEarnings < 0 ? 'text-red-600' : 'text-green-600'} font-medium">Rp ${formatCurrency(record.netEarnings)}</p>
                  </div>
                </div>
              `;
              balanceHistoryList.appendChild(recordEl);
              
              // Add delete event listener
              recordEl.querySelector('.delete-balance-btn').addEventListener('click', function() {
                deleteBalanceRecord(this.dataset.id);
              });
            });
          } else {
            balanceHistoryList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Belum ada riwayat saldo</p>';
          }
        } else {
          balanceHistoryList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Belum ada riwayat saldo</p>';
        }
      })
      .catch((error) => {
        console.error("Error loading balance history:", error);
        balanceHistoryList.innerHTML = '<p class="text-center text-red-500 italic py-4">Error memuat riwayat saldo</p>';
      });
  }
  
  // Delete Balance Record
  function deleteBalanceRecord(id) {
    if (!currentUser) return;
    
    showConfirmDialog(
      'Konfirmasi Hapus',
      'Yakin ingin menghapus catatan saldo ini?',
      () => {
        database.ref(`users/${currentUser.uid}/balanceHistory/${id}`).remove()
          .then(() => {
            console.log("Balance record deleted successfully");
            showAlert("Catatan saldo berhasil dihapus", "success");
            loadBalanceHistory();
          })
          .catch((error) => {
            console.error("Error deleting balance record:", error);
            showAlert("Gagal menghapus catatan saldo", "error");
          });
      }
    );
  }
  
  // Expense Tracker
  document.getElementById('addExpenseBtn').addEventListener('click', function() {
    if (!currentUser) return;
    
    const date = document.getElementById('expenseDate').value || new Date().toISOString().split('T')[0];
    const type = document.getElementById('expenseType').value;
    const description = document.getElementById('expenseDescription').value;
    const amount = parseRupiahInput(document.getElementById('expenseAmount').value);
    
    if (description && amount > 0) {
      const expenseData = {
        date,
        type,
        description,
        amount,
        timestamp: Date.now()
      };
      
      database.ref(`users/${currentUser.uid}/expenses`).push(expenseData)
        .then(() => {
          console.log("Expense data saved successfully");
          // Clear form
          document.getElementById('expenseDescription').value = '';
          document.getElementById('expenseAmount').value = '';
          // Show success message
          showAlert(`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat`, "success");
          // Reload expenses
          loadExpenses();
        })
        .catch((error) => {
          console.error("Error saving expense data:", error);
          showAlert("Gagal menyimpan data", "error");
        });
    } else {
      showAlert("Silakan isi deskripsi dan jumlah dengan benar", "error");
    }
  });
  
  function loadExpenses() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const transactionsList = document.getElementById('transactionsList');
    
    // Clear list
    transactionsList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Memuat transaksi...</p>';
    
    // Get expenses from database
    database.ref(`users/${currentUser.uid}/expenses`)
      .orderByChild('timestamp')
      .once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          let transactions = [];
          let todayIncome = 0;
          let todayExpenses = 0;
          
          snapshot.forEach((childSnapshot) => {
            const expense = childSnapshot.val();
            expense.id = childSnapshot.key;
            
            // Add to transactions array
            transactions.push(expense);
            
            // Calculate today's summary
            if (expense.date === today) {
              if (expense.type === 'income') {
                todayIncome += expense.amount;
              } else {
                todayExpenses += expense.amount;
              }
            }
          });
          
          // Sort transactions by date (most recent first)
          transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Update summary
          document.getElementById('todayIncome').textContent = `Rp ${formatCurrency(todayIncome)}`;
          document.getElementById('todayExpenses').textContent = `Rp ${formatCurrency(todayExpenses)}`;
          document.getElementById('todayBalance').textContent = `Rp ${formatCurrency(todayIncome - todayExpenses)}`;
          document.getElementById('todayBalance').className = 
            (todayIncome - todayExpenses) >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600';
          
          // Display transactions
          if (transactions.length > 0) {
            transactionsList.innerHTML = '';
            transactions.forEach(transaction => {
              const isIncome = transaction.type === 'income';
              const transactionEl = document.createElement('div');
              transactionEl.className = 'flex justify-between items-center p-3 border-b border-gray-200 hover:bg-gray-50';
              transactionEl.innerHTML = `
                <div>
                  <p class="font-medium">${transaction.description}</p>
                  <p class="text-sm text-gray-500">${formatDate(transaction.date)}</p>
                </div>
                <div class="flex items-center">
                  <span class="${isIncome ? 'text-green-600' : 'text-red-600'} font-semibold">
                    ${isIncome ? '+' : '-'} Rp ${formatCurrency(transaction.amount)}
                  </span>
                  <button class="ml-3 text-red-500 delete-btn" data-id="${transaction.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              `;
              transactionsList.appendChild(transactionEl);
              
              // Add delete event listener
              transactionEl.querySelector('.delete-btn').addEventListener('click', function() {
                deleteTransaction(this.dataset.id);
              });
            });
          } else {
            transactionsList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Belum ada transaksi</p>';
          }
        } else {
          transactionsList.innerHTML = '<p class="text-center text-gray-500 italic py-4">Belum ada transaksi</p>';
        }
      })
      .catch((error) => {
        console.error("Error loading expenses:", error);
        transactionsList.innerHTML = '<p class="text-center text-red-500 italic py-4">Error memuat transaksi</p>';
      });
  }
  
  function deleteTransaction(id) {
    showConfirmDialog(
      'Konfirmasi Hapus',
      'Yakin ingin menghapus transaksi ini?',
      () => {
        database.ref(`users/${currentUser.uid}/expenses/${id}`).remove()
          .then(() => {
            console.log("Transaction deleted successfully");
            showAlert("Transaksi berhasil dihapus", "success");
            loadExpenses();
          })
          .catch((error) => {
            console.error("Error deleting transaction:", error);
            showAlert("Gagal menghapus transaksi", "error");
          });
      }
    );
  }
  
  // Alert and confirmation functions
  function showAlert(message, type = "info") {
    const alertElement = document.createElement('div');
    
    // Set classes based on alert type
    let bgColor, textColor, borderColor;
    switch(type) {
      case "success":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        borderColor = "border-green-200";
        break;
      case "error":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        borderColor = "border-red-200";
        break;
      case "warning":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        borderColor = "border-yellow-200";
        break;
      default:
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        borderColor = "border-blue-200";
    }
    
    alertElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md ${bgColor} ${textColor} ${borderColor} border transform transition-transform duration-300 ease-in-out`;
    alertElement.style.maxWidth = '90%';
    alertElement.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3">
          ${type === "success" ? 
            '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' : 
            type === "error" ? 
            '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>' :
            type === "warning" ?
            '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>' :
            '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 000-2H9z" clip-rule="evenodd"/></svg>'
          }
        </div>
        <p>${message}</p>
      </div>
    `;
    
    document.body.appendChild(alertElement);
    
    // Animate in
    setTimeout(() => {
      alertElement.classList.add('translate-y-2');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      alertElement.classList.remove('translate-y-2');
      alertElement.classList.add('-translate-y-1', 'opacity-0');
      setTimeout(() => {
        if (document.body.contains(alertElement)) {
          document.body.removeChild(alertElement);
        }
      }, 300);
    }, 3000);
  }
  
  function showConfirmDialog(title, message, onConfirm) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'bg-white rounded-lg shadow-lg max-w-md w-full mx-4';
    dialog.innerHTML = `
      <div class="p-4 border-b">
        <h3 class="text-lg font-medium">${title}</h3>
      </div>
      <div class="p-4">
        <p>${message}</p>
      </div>
      <div class="p-4 border-t flex justify-end space-x-2">
        <button class="cancel-btn px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">
          Batal
        </button>
        <button class="confirm-btn px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
          Hapus
        </button>
      </div>
    `;
    
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    
    // Add event listeners
    dialog.querySelector('.cancel-btn').addEventListener('click', function() {
      document.body.removeChild(backdrop);
    });
    
    dialog.querySelector('.confirm-btn').addEventListener('click', function() {
      document.body.removeChild(backdrop);
      onConfirm();
    });
  }
  
  function loadUserData() {
    // Set today's date as default for expense date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
  }
  
  // Utility functions
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }
  
  // Initialize to payment section
  showSection('paymentSection');
  updateNavActiveState('navPayment');