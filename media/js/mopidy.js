if (window.NodeList && !NodeList.prototype.forEach) {
  // Polyfill NodeList.forEach
  // https://caniuse.com/#feat=mdn-api_nodelist_foreach
  NodeList.prototype.forEach = Array.prototype.forEach;
}

function setupNavbarBurger(navbarBurger) {
  navbarBurger.addEventListener("click", () => {
    const target = document.getElementById(navbarBurger.dataset.target);
    navbarBurger.classList.toggle("is-active");
    target.classList.toggle("is-active");
  });
}

function setupTabs(tabContainer) {
  const tabs = tabContainer.querySelectorAll("li");
  const contents = [];

  if (tabs.length == 0) {
    return;
  }

  tabs.forEach(tab => {
    const link = tab.querySelector("a");
    const content = document.querySelector(link.getAttribute("href"));
    contents.push(content);

    link.addEventListener("click", event => {
      event.preventDefault();

      tabs.forEach(el => el.classList.remove("is-active"));
      tab.classList.add("is-active");

      contents.forEach(el => el.classList.add("is-hidden"));
      content.classList.remove("is-hidden");
    });
  });

  tabs[0].querySelector("a").click();
}

function select(el) {
  const range = document.createRange();
  range.selectNodeContents(el);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function setupCopy(el) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("copy-container");

  const button = document.createElement("button");
  button.textContent = "Copy";
  button.addEventListener("click", event => {
    event.preventDefault();
    button.classList.add("is-loading");
    setTimeout(_ => button.classList.remove("is-loading"), 200);
    select(el);
    document.execCommand("copy");
  });

  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  wrapper.appendChild(button);
}

function openPopup(target, title) {
  return window.open(
    target,
    title,
    [
      "toolbar=no",
      "location=no",
      "directories=no",
      "status=no",
      "menubar=no",
      "scrollbars=no",
      "resizable=no",
      "copyhistory=no",
      "width=" + 800,
      "height=" + 600,
      "left=" + (screen.width / 2 - 800 / 2),
      "top=" + (screen.height / 2 - 600 / 2)
    ].join(", ")
  );
}

function setupAuth(auth) {
  let checkPopupInterval = null;

  const button = auth.querySelector(".auth-button");
  const error = auth.querySelector(".auth-error");
  const callbackOrigin = new URL(auth.dataset.origin || button.href).origin;

  const reset = _ => {
    clearInterval(checkPopupInterval);
    error.classList.add("is-hidden");
    button.classList.remove("is-loading");
  };

  window.addEventListener("message", event => {
    if (event.origin !== callbackOrigin) {
      return;
    }

    reset();
    event.source.close();

    if (event.data.error) {
      error.innerText = event.data.error.toUpperCase();
      if (event.data.error_description) {
        let desc = event.data.error_description;
        desc = desc.replace(/^\w/, c => c.toUpperCase());
        desc = desc.replace(/([.]?$)/, ".");
        error.innerText += ": " + desc;
      }
      error.classList.remove("is-hidden");
    } else {
      auth.querySelectorAll("[data-name]").forEach(el => {
        el.innerText = event.data[el.dataset.name];
      });
    }
  });

  button.addEventListener("click", event => {
    event.preventDefault();
    if (button.classList.contains("is-loading")) {
      return;
    }


    reset();
    button.classList.add("is-loading");

    const url = new URL(button.href);
    const state = Math.random().toString(36).substr(2);
    url.search += (url.search ? '&' : '?') + 'state=' + state;

    const popup = openPopup(url.href, "Authenticate Mopidy extension.");
    checkPopupInterval = setInterval(_ => {
      if (!popup || popup.closed) {
        reset();
        error.innerText = "Popup closed without completing authentication.";
        error.classList.remove("is-hidden");
      } else {
        popup.postMessage(state, callbackOrigin);
      }
    }, 200);
  });
}

function setupLazyIFrame(el) {
  const frame = document.createElement("iframe");
  frame.setAttribute("frameborder", "0");
  frame.setAttribute("allowfullscreen", "");
  frame.setAttribute("src", el.dataset.iframe);

  el.addEventListener('click', event => {
    event.preventDefault();
    el.style.display = "block";
    frame.setAttribute("width", el.offsetWidth);
    frame.setAttribute("height", el.offsetHeight);
    frame.setAttribute("class", el.getAttribute("class"));
    el.parentNode.replaceChild(frame, el);
  });
}

function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

onReady(() => {
  document.querySelectorAll(".navbar-burger").forEach(setupNavbarBurger);
  document.querySelectorAll(".tabs").forEach(setupTabs);
  document.querySelectorAll(".copy").forEach(setupCopy);
  document.querySelectorAll(".auth").forEach(setupAuth);
  document.querySelectorAll("[data-iframe]").forEach(setupLazyIFrame);
});
