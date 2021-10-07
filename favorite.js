const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
const INDEX_URL = BASE_URL + '/api/v1/users/'
const USERS_PER_PAGE = 12
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const dataPanel = document.querySelector('#data-panel')
let paginator = document.querySelector('#paginator')
let filterUsers = []
const favoriteUsers = JSON.parse(localStorage.getItem('favoriteUser')) || []
const favoriteUserIds = favoriteUsers.map((user) => user.id)
// 直接指定users為favoriteUers，多項函式與index.js程式碼重複不需再次修改
const users = favoriteUsers
// 紀錄頁碼
let pageCurrent = 1
// 紀錄彈出警告式窗 setInterval id
let IntervalID = 0
let timeoutID = 0

// 渲染頁碼
function renderPaginator(amount) {
  // 頁數 = 總數除以每頁人數
  const numberOfPages = Math.ceil(amount / USERS_PER_PAGE) || 1
  let rawHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    let pageActive = pageCurrent === page ? 'active' : ''
    rawHTML += `
    <li class="page-item ${pageActive}"><a class="page-link" href="#" data-page="${page}">${page}</a></li>
    `
  }
  paginator.innerHTML = rawHTML
}

// 將指定頁碼標記 active ，並取得對應的電影資料
function getUsersByPage(page) {
  const startIndex = (page - 1) * USERS_PER_PAGE
  const data = filterUsers.length !== 0 ? filterUsers : users
  return data.slice(startIndex, startIndex + USERS_PER_PAGE)
}

// favoriteUserIds.includes(user.id) 依照最愛與否顯示不同圖示
// user.gender === 'male' 依照性別顯示不同圖示
function renderUserList(users) {
  let rawHTML = ''
  users.forEach(function (user) {
    const genderIcon = user.gender === 'male' ? 'fas fa-mars' : 'fas fa-venus'
    const favoriteIcon = favoriteUserIds.includes(user.id) ? 'fas fa-heart' : 'far fa-heart'
    rawHTML += `
      <div class="col-6 col-sm-6 col-md-4 col-lg-3 px-3 py-3">    
        <div class="card rounded-circle  border border-light"  >
          <a href="##"><img src="${user.avatar}" class="card-img-top rounded-circle"
            alt="user-img" data-id="${user.id}" id="user-image" data-toggle="modal" 
          data-target="#user-modal"></a>
        </div>
        <div class="card-text text-center">
          ${user.name}<i class="${genderIcon} d-inline"></i> ${getAge(user.birthday)} <a href="##"><i class="${favoriteIcon} float-right" data-id="${
      user.id
    }"></i></a>
        </div>
      </div>
    `
  })
  dataPanel.innerHTML = rawHTML
}

// 換算年齡
function getAge(birthday) {
  var birthDayTime = new Date(birthday).getTime()
  var nowTime = new Date().getTime()
  // 31536000000 1年的毫秒
  return Math.ceil((nowTime - birthDayTime) / 31536000000)
}

// 彈出式顯示
function showUserModal(id) {
  // modal node
  const userModal = document.querySelector('#user-modal')
  const modalName = document.querySelector('#user-modal-name')
  const modalImage = document.querySelector('#user-modal-image img')
  const modalGender = document.querySelector('#user-modal-gender')
  const modalRegion = document.querySelector('#user-modal-region')
  const modalBirthday = document.querySelector('#user-modal-birthday')
  const modalEmail = document.querySelector('#user-modal-email')
  const modalUpdated = document.querySelector('#user-modal-updated')
  // 將區塊隱藏
  userModal.classList.add('d-none')
  // 取得指定使用者資訊
  axios
    .get(INDEX_URL + id)
    .then((response) => {
      // 忽略 id, age, created_at
      // object不需要忽略，直接指定即可參數名稱
      // 若參數名稱不一樣則無法正常賦值
      const { name, surname, email, gender, region, birthday, avatar, updated_at } = response.data
      // 重新賦值
      modalName.innerText = name + ' ' + surname
      modalImage.src = avatar
      modalGender.innerText = gender
      modalRegion.innerText = region
      modalBirthday.innerText = birthday
      modalEmail.innerText = email
      modalUpdated.innerText = updated_at
      // 取得資料後，將區塊顯示
      userModal.classList.remove('d-none')
    })
    .catch((err) => console.log(err))
}
// 計算出當下應渲染的頁碼
function getNowPage(index, length) {
  let amount = index + 1
  // 如果刪除的項目剛好是本頁最後一個
  if (USERS_PER_PAGE % index === 0 && index === length - 1) amount--
  return Math.ceil(amount / USERS_PER_PAGE) || 1
}

// 跳出動態收藏訊息
function showFavoriteAlert(message) {
  const alertNode = document.querySelector('.alert')
  // 將訊息 div 顯示出來
  alertNode.classList.remove('d-none')
  // 不透明度設為 1 , 大小為1.1倍
  let opacityValue = 0.1
  let scaleValue = 0
  alertNode.style.opacity = opacityValue
  alertNode.style.scale = scaleValue
  // 新增與移除的狀態處理
  if (message === 'add') {
    alertNode.classList.remove('alert-secondary')
    alertNode.classList.add('alert-success')
    alertNode.innerHTML = '<h5>Add to favorite</h5>'
  } else if (message === 'remove') {
    alertNode.classList.remove('alert-success')
    alertNode.classList.add('alert-secondary')
    alertNode.innerHTML = '<h5>Remove from favorite</h5>'
  }
  // 當再次呼叫 showFavoriteAlert 時，將正在執行的動作終止
  clearTimeout(timeoutID)
  clearInterval(IntervalID)
  // 啟動定時調用，製造視窗彈出的效果
  IntervalID = setInterval(() => {
    opacityValue += 0.1
    scaleValue += 0.1
    alertNode.style.opacity = opacityValue
    alertNode.style.scale = scaleValue
    if (scaleValue >= 1) {
      // 終止Interval調用
      clearInterval(IntervalID)
      // 啟動延遲調用
      timeoutID = setTimeout(() => {
        // 啟動定時調用，每0.02秒不透明度減少0.1
        IntervalID = setInterval(() => {
          opacityValue -= 0.1
          scaleValue -= 0.01
          alertNode.style.opacity = opacityValue
          alertNode.style.scale = scaleValue
          // 重複直到，透明度小於0.1，終止Interval調用
          if (opacityValue <= 0.1) {
            // display:none 將訊息隱藏
            alertNode.classList.add('d-none')
            clearInterval(IntervalID)
          }
        }, 20)
      }, 500)
    }
  }, 5)
}

// 移除最愛
function removeFromFavorite(id) {
  const userIndex = favoriteUsers.findIndex((user) => user.id === id)
  const filterUserIndex = filterUsers.findIndex((user) => user.id === id)
  if (userIndex === -1) return

  // 如果是 search 模式下`, filterUsers 有資料
  pageCurrent =
    filterUsers.length !== 0
      ? getNowPage(filterUserIndex, filterUsers.length)
      : // 不是 search 模式下`, 使用 favoriteUsers
        getNowPage(userIndex, favoriteUsers.length)

  // 移除最愛名單及id名單，與過濾名單
  favoriteUsers.splice(userIndex, 1)
  favoriteUserIds.splice(userIndex, 1)
  filterUsers.splice(filterUserIndex, 1)

  localStorage.setItem('favoriteUser', JSON.stringify(favoriteUsers))
  renderPaginator(filterUsers.length !== 0 ? filterUsers.length : favoriteUsers.length)
  renderUserList(getUsersByPage(pageCurrent))
}

// 監聽資料串，顯示資料與移除最愛
dataPanel.addEventListener('click', function onPanelClicked(event) {
  const target = event.target
  const id = Number(target.dataset.id)
  if (target.matches('.card-img-top')) {
    showUserModal(target.dataset.id)
  } else if (target.matches('.fas.fa-heart')) {
    showFavoriteAlert('remove')
    target.className = target.className.replace('fas', 'far')
    removeFromFavorite(id)
  }
})

// 搜尋監聽
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  event.preventDefault()
  const keyword = searchInput.value.trim().toLowerCase()
  searchInput.value = searchInput.value.trim()
  filterUsers = users.filter((user) => user.name.toLowerCase().includes(keyword))
  if (filterUsers.length === 0) {
    return alert('請輸入有效字串！')
  }
  pageCurrent = 1
  renderPaginator(filterUsers.length)
  renderUserList(getUsersByPage(pageCurrent))
})

// 頁碼監聽
paginator.addEventListener('click', function onPaginatorClicked(event) {
  const target = event.target
  pageCurrent = Number(target.dataset.page)
  if (target.tagName === 'A') {
    renderPaginator(filterUsers.length !== 0 ? filterUsers.length : favoriteUsers.length)
    renderUserList(getUsersByPage(pageCurrent))
  }
})

// ------------------------------------------------------------------
// 網頁啟動時渲染
renderPaginator(favoriteUsers.length)
renderUserList(getUsersByPage(1))
