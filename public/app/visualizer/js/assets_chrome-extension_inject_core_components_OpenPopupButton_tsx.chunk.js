!function() {
    try {
        var e = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : {}
          , t = (new e.Error).stack;
        t && (e._sentryDebugIds = e._sentryDebugIds || {},
        e._sentryDebugIds[t] = "e4f69bca-cb0b-4b95-8f7a-89038a990d12",
        e._sentryDebugIdIdentifier = "sentry-dbid-e4f69bca-cb0b-4b95-8f7a-89038a990d12")
    } catch (e) {}
}();
var _global = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : {};
_global.SENTRY_RELEASE = {
    id: "chrome-extension@13.0.2"
};
"use strict";
(globalThis.webpackChunkleadgenie = globalThis.webpackChunkleadgenie || []).push([["assets_chrome-extension_inject_core_components_OpenPopupButton_tsx"], {
    16519: (e, t, l) => {
        l.d(t, {
            Z: () => o
        });
        let o = {
            self: "x_EZ1gF",
            aside: "x_r8xjp",
            full: "x_tMKGw",
            "sidebar-menu": "x_lBYKU",
            "expand-collapse": "x_m5gcN",
            divider: "x_CZOQT",
            item: "x_kqgh3",
            "collapse-button": "x_iG3aL",
            "expand-button": "x_LNOts",
            "close-button": "x_uhqwi",
            "apollo-button": "x_dlDc5",
            "salesforce-button": "x_ZfRQH",
            "zp-frame-wrapper": "x_GzWRl",
            "zp-frame": "x_IPHLp",
            "zp-app-abs-button": "x_R61yl",
            icon: "x_kJtSQ",
            apolloEverywhereButton: "x_zkgEc",
            "gmail-toolbar-button-zp": "x_sdQHK",
            "gmail-toolbar-button-sf": "x_GN4iP",
            "linkedin-search-tooltip": "x_RV71O",
            linkedinOverlayContainer: "x_Gq2Xt",
            revampedOverlayContainer: "x_Geo7J",
            hsZIndexOverride: "x__vRIU",
            zIndexOverride: "x_D9BRQ",
            positionLeft: "x_riflu",
            positionRight: "x_A12Jz",
            positionLeftV2: "x_cYOJy",
            positionRightV2: "x_LWZtR",
            linkedInSalesNavBtns: "x_YOYEe",
            linkedinIframe: "x_edjDz",
            salesforceIframe: "x_Lg9oI",
            hubspotIframe: "x_hrC8A",
            closed: "x_yAMLW",
            opened: "x_vpkab",
            v2: "x_iLxJt",
            fullVh: "x_k0lLB",
            onboardingWidth: "x_tYqNv",
            fullSize: "x_ZFiXJ",
            iframeSalesforceToolbarContainer: "x_kBvCL",
            fullWidth: "x_fVVYf",
            iframeHubspotToolbarContainer: "x_Bm2_D",
            fullToolbarWidth: "x_HxFVB",
            salesforceIconClosed: "x_WgQ84",
            classicToolbarContainer: "x_Kf8ui",
            classicCampaignToolbar: "x_GXNTT"
        }
    }
    ,
    74745: (e, t, l) => {
        l.r(t),
        l.d(t, {
            addPopupButton: () => j
        });
        var o = l(85893)
          , n = l(50533)
          , a = l(77688)
          , i = l(67294)
          , u = l(94184)
          , d = l.n(u)
          , r = l(33812)
          , s = l(82546)
          , M = l(52152)
          , c = l(64505)
          , b = l(53185)
          , p = l(46766)
          , x = l(16519);
        let g = () => {
            let[e,t] = (0,
            i.useState)()
              , l = (0,
            n.useSelector)(e => e.gmail.sidebar.isSidebarOpen);
            return ((0,
            i.useEffect)( () => {
                "gmail" === (0,
                c.WQ)() && r.load(2, "sdk_zenprospect_c06b4c22e9").then(e => {
                    let l = document.createElement("div");
                    e.Global.addSidebarContentPanel({
                        el: l,
                        title: (0,
                        s.D8)(),
                        iconUrl: (0,
                        s.M_)()
                    }).then(e => {
                        null == e || e.close(),
                        t(e ?? void 0);
                        let l = document.querySelector(`.inboxsdk__button_icon[data-tooltip="${(0,
                        s.D8)()}"]`)
                          , o = document.createElement("div");
                        o.className = "apollo-sidebar-button-wrapper",
                        o.setAttribute("role", "tab"),
                        o.setAttribute("aria-label", "Apollo");
                        let n = document.createElement("div");
                        n.className = "apollo-sidebar-button-container";
                        let a = document.createElement("input");
                        a.type = "button",
                        a.className = "apollo-sidebar-input",
                        a.addEventListener("click", () => {
                            (0,
                            M.Fb)()
                        }
                        ),
                        a.addEventListener("mouseover", () => {
                            document.activeElement && "blur"in document.activeElement && "function" == typeof document.activeElement.blur && document.activeElement.blur()
                        }
                        );
                        let i = document.createElement("img");
                        i.src = (0,
                        s.M_)(),
                        i.alt = "Apollo",
                        i.className = "apollo-sidebar-icon",
                        i.draggable = !1,
                        n.appendChild(a),
                        n.appendChild(i),
                        o.appendChild(n),
                        null == l || l.replaceWith(o)
                    }
                    )
                }
                ).catch( () => {}
                )
            }
            , []),
            (0,
            i.useEffect)( () => {
                (null == e ? void 0 : e.isActive()) && (null == e || e.close())
            }
            , [l, e]),
            "gmail" === (0,
            c.WQ)()) ? null : (0,
            o.jsx)("div", {
                onClick: M.Fb,
                className: d()(x.Z["zp-app-abs-button"], (0,
                b.V$)("zp-fixed", !0)),
                children: (0,
                o.jsx)("img", {
                    alt: "Apollo.io",
                    src: p,
                    className: d()(x.Z.icon)
                })
            })
        }
        ;
        var L = l(62977)
          , _ = l(42631);
        function j() {
            var e;
            if (document.querySelector(".zp-open-popup-button"))
                return;
            let t = document.createElement("div");
            t.className = "zp-open-popup-button",
            null == (e = document.querySelector("body > div")) || e.before(t),
            (0,
            L.s)(t).render((0,
            o.jsx)(n.Provider, {
                store: a.default,
                children: (0,
                o.jsx)(_.L, {
                    children: (0,
                    o.jsx)(g, {})
                })
            }))
        }
    }
    ,
    46766: e => {
        e.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBmaWxsPSIjZWJmMjEyIiBkPSJtMjEuNDY2IDUuMDcxLjAwNCAxMC45MTVjLjAwMSAxLjcyNS0xLjgzNCAyLjgzLTMuMzU4IDIuMDI0TDcuMTcgMTIuMjIzYTE1LjEgMTUuMSAwIDAgMSAzLjEtMy42NGw4LjU4MiA3LjkzMmMuNDU1LjQyIDEuMTcyLS4wMzYuOTg1LS42MjZMMTYuNTA5IDUuNDFhMTUgMTUgMCAwIDEgNC45NTYtLjMzOE0xOC40OTYgMzQuOTI1bC0uMDA1LTEwLjg2YzAtMS43MjQgMS44MzQtMi44MyAzLjM1OS0yLjAyM2wxMC45NDYgNS43OWExNSAxNSAwIDAgMS0zLjExNiAzLjYyNmwtOC41Ny03LjkyMWMtLjQ1NS0uNDItMS4xNzIuMDM1LS45ODUuNjI1bDMuMzE2IDEwLjQ0MWExNSAxNSAwIDAgMS00Ljk0NS4zMjJNMjMuNDkyIDE4Ljg5OCAzMS40NCAxMC4zYTE1IDE1IDAgMCAwLTMuNjQtMy4xMTNsLTUuODA0IDEwLjk3MmMtLjgwNiAxLjUyNC4zIDMuMzU5IDIuMDI0IDMuMzU4bDEwLjkwNS0uMDA1YTE1LjIgMTUuMiAwIDAgMC0uMzI0LTQuOTU4bC0xMC40ODQgMy4zM2MtLjU5LjE4Ny0xLjA0NS0uNTMtLjYyNS0uOTg1TTUuMDcgMTguNTRsMTAuODcyLS4wMDRjMS43MjUgMCAyLjgzIDEuODM0IDIuMDI0IDMuMzU4TDEyLjE5MiAzMi44MWExNSAxNSAwIDAgMS0zLjYyNy0zLjEwM2w3LjkwNi04LjU1M2MuNDItLjQ1NS0uMDM2LTEuMTcyLS42MjYtLjk4NUw1LjQwOCAyMy40ODRhMTUgMTUgMCAwIDEtLjMzNy00Ljk0MyIvPjwvc3ZnPg=="
    }
}]);
//# sourceMappingURL=assets_chrome-extension_inject_core_components_OpenPopupButton_tsx.chunk.js.map
