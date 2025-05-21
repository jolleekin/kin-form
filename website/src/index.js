// /**
//  * @fileoverview
//  * This module handles page navigation without full reloads to ensure a smooth UX.
//  */

// const doc = document;

// const frag = doc.createElement("div");
// frag.innerHTML =
//   '<div class="fixed left-0 right-0 top-0 z-50 h-1 text-xxl text-red-500">Loading</div>';
// const indicator = frag.firstElementChild;

// async function resolve() {
//   if (!indicator.isConnected) doc.body.appendChild(indicator);

//   indicator.hidden = false;

//   // Try to load the new page in the background for a smooth UX.
//   //
//   // Except for the document title, all page specific contents,
//   // including CSS and JS, must be in the body tag.
//   try {
//     const response = await fetch(location.href);
//     const html = await response.text();
//     const [_, title, body] = html.match(
//       /<title>(.*)<\/title>[\s\S]+<body.*?>([\s\S]*)<\/body>/
//     );
//     doc.title = title;
//     doc.body.innerHTML = body;

//     indicator.hidden = true;
//   } catch {
//     location.reload();
//   }
// }

// /**
//  * @param {Event} event
//  */
// function handleClick(event) {
//   /** @type {HTMLAnchorElement|undefined} */
//   const anchor = event.composedPath().find((t) => t.tagName === "A");
//   if (anchor === undefined) return;
//   if (anchor.target) return;

//   event.preventDefault();

//   if (anchor.href === location.href) return;

//   history.pushState("", "", anchor.href);
//   resolve();
// }

// onpopstate = resolve;

// doc.addEventListener("click", handleClick, { capture: true });
