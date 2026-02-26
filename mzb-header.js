// ساخت فایل PWA Manifest
(function(){var manifest={"name":"مژه بازار","short_name":"مژه بازار","description":"معتبرترین سایت خرید محصولات آرایشی اورجینال","scope":"/","start_url":"https://mozhebazar.com/","display":"standalone","background_color":"#ffffff","theme_color":"#0d6efd","orientation":"portrait","icons":[{"src":"https://mozhebazar.com/shop/pic/product/mozhebazar/290_9.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"https://mozhebazar.com/shop/pic/product/mozhebazar/290_9.png","sizes":"512x512","type":"image/png","purpose":"any"}]};var stringManifest=JSON.stringify(manifest);var blob=new Blob([stringManifest],{type:'application/manifest+json'});var manifestURL=URL.createObjectURL(blob);var link=document.createElement('link');link.rel='manifest';link.href=manifestURL;document.head.appendChild(link);})();

"use strict";"scrollRestoration"in history&&(history.scrollRestoration="manual");
let MZB_ALL_PRODUCTS=[];
const MZB_HOME_URL = "https://mozhebazar.com";
const CACHE_KEY = "mzb_smart_menu_v3"; // نام کش در مرورگر
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // کش برای 24 ساعت

async function mzb_init_data() {
    const navContainer = document.getElementById("mzb-dynamic-nav");
    const contentContainer = document.getElementById("mzb-dynamic-content");
    if (!navContainer || !contentContainer) return;

    let categoriesData = null;

    // ۱. بررسی حافظه مرورگر (آیا قبلاً محصولات را لود و سبک کرده ایم؟)
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const parsedCache = JSON.parse(cachedData);
            if (new Date().getTime() - parsedCache.timestamp < CACHE_EXPIRY) {
                categoriesData = parsedCache.data;
            }
        } catch (e) { localStorage.removeItem(CACHE_KEY); }
    }

    // ۲. اگر در کش نبود، سایت را میخوانیم و عکس ها را سبک میکنیم
    if (!categoriesData) {
        contentContainer.innerHTML = '<div class="mzb-loader"><div class="mzb-spinner"></div>در حال بارگذاری لیست محصولات...</div>';
        
        try {
            let htmlDoc = document;
            // اگر در صفحه اصلی نیستیم، کدهای صفحه اصلی را در پس زمینه دانلود کن
            if (document.querySelectorAll(".category-tile").length === 0) {
                const response = await fetch(MZB_HOME_URL);
                if (!response.ok) throw new Error("Fetch failed");
                const htmlText = await response.text();
                htmlDoc = new DOMParser().parseFromString(htmlText, "text/html");
            }

            categoriesData = [];
            const catTiles = htmlDoc.querySelectorAll(".category-tile");
            
            catTiles.forEach(catTile => {
                let catName = (catTile.querySelector('.cat-name') || catTile.querySelector('.hidden-cat-title'))?.innerText?.trim() || "دسته";
                let catLink = catTile.getAttribute('href') || "#";
                let products = [];
                let prodContainer = catTile.nextElementSibling;
                
                if (prodContainer && (prodContainer.classList.contains('hidden-source-data') || prodContainer.querySelectorAll('.js-product-item').length > 0)) {
                    prodContainer.querySelectorAll('.js-product-item').forEach(pNode => {
                        // استخراج نام، لینک و قیمت
                        let pName = pNode.querySelector('.js-schema-title')?.innerText?.trim() || pNode.querySelector('.p-title')?.innerText?.trim() || "";
                        let pLink = pNode.querySelector('.js-schema-url')?.innerText?.trim() || pNode.querySelector('a')?.getAttribute('href') || "#";
                        let pPrice = pNode.querySelector('.js-schema-price')?.innerText?.replace(/[^0-9]/g, '') || "0";
                        let pStock = pNode.querySelector('.js-schema-stock')?.innerText?.trim() === 'InStock' || !pNode.querySelector('.add-cart-btn[disabled]');
                        
                        // ===== جادوی سبک‌سازی عکس به صورت زنده =====
                        let rawImg = pNode.querySelector('.js-schema-img')?.innerText?.trim() || pNode.querySelector('img')?.src || "";
                        let cleanImg = rawImg.replace(/^https?:\/\//, ''); 
                        // تبدیل به عکس 100 پیکسلی با فرمت webp
                        let optimizedImg = cleanImg ? `https://wsrv.nl/?url=${cleanImg}&w=100&output=webp&q=70` : "";
                        // ============================================

                        if (pName) {
                            products.push({ name: pName, link: pLink, image: optimizedImg, price: pPrice, inStock: pStock });
                        }
                    });
                }
                if(products.length > 0) {
                    categoriesData.push({ category: catName, link: catLink, products: products });
                }
            });

            // ذخیره نتیجه سبک شده در حافظه گوشی کاربر برای 24 ساعت آینده
            if (categoriesData.length > 0) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: new Date().getTime(), data: categoriesData }));
            }

        } catch (error) {
            console.error(error);
            contentContainer.innerHTML = '<div style="padding:20px;text-align:center;">خطا در ارتباط با سرور</div>';
            return;
        }
    }

    // ۳. رندر کردن منو و کارت ها در سایت
    if (categoriesData && categoriesData.length > 0) {
        navContainer.innerHTML = "";
        contentContainer.innerHTML = "";
        MZB_ALL_PRODUCTS = [];

        categoriesData.forEach((category, index) => {
            const tabBtn = document.createElement("div");
            tabBtn.className = `mzb-tab-trigger ${index === 0 ? "active" : ""}`;
            tabBtn.innerText = category.category;
            tabBtn.onclick = () => mzb_switch_tab(index);
            navContainer.appendChild(tabBtn);

            const secDiv = document.createElement("div");
            secDiv.className = `mzb-sec ${index === 0 ? "active" : ""}`;
            
            let productsHtml = "";
            category.products.forEach(product => {
                MZB_ALL_PRODUCTS.push({
                    name: product.name, link: product.link,
                    imgSrc: product.image, priceText: Number(product.price).toLocaleString('fa-IR'),
                    isOutOfStock: !product.inStock
                });
                productsHtml += mzb_create_card_html({
                    name: product.name, link: product.link,
                    imgSrc: product.image, priceText: Number(product.price).toLocaleString('fa-IR'),
                    isOutOfStock: !product.inStock
                });
            });
            
            if(category.link && category.link !== "#") {
                 productsHtml += `<a href="${category.link}" class="mzb-show-all-btn">نمایش همه <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`;
            }

            secDiv.innerHTML = productsHtml || '<div style="text-align:center;padding:20px;color:#aaa;">موردی یافت نشد.</div>';
            contentContainer.appendChild(secDiv);
        });
        mzb_init_sticky_tabs_from_db(categoriesData);
    } else {
        contentContainer.innerHTML = '<div style="padding:20px;text-align:center;">دسته‌ای یافت نشد.</div>';
    }
}

// تولید کدهای HTML کارت با قابلیت Lazy Loading برای عکس های سبک شده
function mzb_create_card_html(e){return`\n <a href="${e.link}" class="mzb-menu-prod">\n ${e.isOutOfStock?'<span class="mzb-badge">ناموجود</span>':""}\n <div style="background:#f5f5f5; width:100%; aspect-ratio:1/1;"><img src="${e.imgSrc}" class="mzb-prod-img" alt="${e.name}" loading="lazy" style="width:100%; height:100%; object-fit:contain;"></div>\n <div class="mzb-add-btn">\n <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>\n </div>\n <div class="mzb-prod-info">\n <span class="mzb-prod-name">${e.name}</span>\n <div style="margin-top:auto">\n <div class="mzb-price-row">\n ${e.priceText?`<span>${e.priceText}</span><span class="mzb-price-unit">تومان</span>`:'<span style="font-weight:400;color:#888;font-size:11px">مشاهده</span>'}\n </div>\n </div>\n </div>\n </a>\n `}

function mzb_init_sticky_tabs_from_db(data){const t=document.getElementById("mzb-sticky-tabs");if(t){t.innerHTML='<a href="/" class="sticky-pill" rel="nofollow">همه محصولات</a>';data.forEach(cat=>{if(cat.link){const l=document.createElement("a"); l.className="sticky-pill"; l.innerText=cat.category; l.href=cat.link; t.appendChild(l);}});const n=window.location.href,o=t.querySelectorAll(".sticky-pill");o.forEach((e=>{e.href===n?e.classList.add("active"):e.classList.remove("active")}));}}
function mzb_open_side(){history.pushState({mzbMenuOpen:!0},"",null),document.getElementById("mzb-side").classList.add("active"),document.getElementById("mzb-overlay").classList.add("active"),document.body.classList.add("mzb-menu-open")}
function mzb_normalize_text(e){return e?e.replace(/[۰-۹]/g,(e=>"۰۱۲۳۴۵۶۷۸۹".indexOf(e))).replace(/[٠-٩]/g,(e=>"٠١٢٣٤٥٦٧٨٩".indexOf(e))).toLowerCase():""}
function mzb_global_search(){const e=document.getElementById("mzb-search-input"),t=document.getElementById("mzb-search-clear"),n=mzb_normalize_text(e.value.trim()),o=document.getElementById("mzb-search-results");n.length>0?t.classList.add("visible"):t.classList.remove("visible");if(n.length<2)return o.classList.remove("active"),document.getElementById("mzb-overlay").classList.remove("active"),void document.body.classList.remove("mzb-menu-open");o.classList.add("active"),document.getElementById("mzb-overlay").classList.add("active"),document.body.classList.add("mzb-menu-open");const a=n.split(" ").filter((e=>e.length>0)),c=MZB_ALL_PRODUCTS.filter((e=>{const t=mzb_normalize_text(e.name);return a.every((e=>t.includes(e)))}));o.innerHTML=c.length>0?`<div class="mzb-sec active" style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">${c.map((e=>mzb_create_card_html(e))).join("")}</div>`:'<div style="text-align:center;padding:50px;color:#aaa;">محصولی یافت نشد.</div>'}
function mzb_clear_search(){const e=document.getElementById("mzb-search-input");e.value="",mzb_global_search(),e.focus()}
function mzb_close_all(){document.getElementById("mzb-search-results").classList.remove("active"),document.getElementById("mzb-side").classList.remove("active"),document.getElementById("mzb-overlay").classList.remove("active"),document.body.classList.remove("mzb-menu-open");const cb=document.getElementById("mzb-fab-check");if(cb)cb.checked=!1;}
function mzb_switch_tab(e){mzb_open_side(),document.querySelectorAll(".mzb-tab-trigger").forEach((e=>e.classList.remove("active"))),document.querySelectorAll(".mzb-sec").forEach((e=>e.classList.remove("active"))),document.querySelectorAll(".mzb-tab-trigger")[e]?.classList.add("active"),document.querySelectorAll(".mzb-sec")[e]?.classList.add("active"),document.getElementById("mzb-dynamic-content").scrollTop=0}
function mzb_init_scrolling_arrow(){const e=document.getElementById("mzb-sticky-tabs"),t=document.getElementById("mzb-arrow-left");if(e&&t){const n=()=>{e.scrollWidth>e.clientWidth?t.classList.add("visible"):t.classList.remove("visible")};e.addEventListener("scroll",()=>{t.style.display="none"},{once:!0});const o=new MutationObserver(n);o.observe(e,{childList:!0,subtree:!0}),window.addEventListener("resize",n),setTimeout(n,500)}}

document.addEventListener("DOMContentLoaded",()=>{
    // اجرای هوشمندانه ساخت منو
    setTimeout(mzb_init_data, 500); 
    
    mzb_init_scrolling_arrow();
    const e=document.querySelectorAll(".mzb-bottom-bar .mzb-item"),t=window.location.pathname;
    e.forEach((n=>{const o=n.getAttribute("href");n.addEventListener("click",(()=>{e.forEach((e=>e.classList.remove("active"))),n.classList.add("active")})),o&&t===o&&n.classList.add("active")}));
});

function disableselect(e){return false}
function reEnable(){return true}
document.onselectstart=new Function ("return false");
if (window.sidebar){document.onmousedown=disableselect;document.onclick=reEnable;}
