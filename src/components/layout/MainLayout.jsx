import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ItemPage from "../pages/ItemPage";
import ItemClassPage from "../pages/ItemClassPage";
import ItemGroupPage from "../pages/ItemGroupPage";
import PlantPage from "../pages/PlantPage";
import "../../css/layout/MainLayout.css";

/**
 * MainLayout — bố cục chính với:
 *  - Sidebar (accordion, collapsed/expanded)
 *  - Header (tabs + actions)
 *  - Content area — render page dựa trên activeTabId
 *
 * Tab management: khi user chọn menu item → thêm tab mới
 */

/* ── Map menuCd → component ──────────────────────────────── */
const PAGE_MAP = {
  B009: ItemPage,   // Item
  B012: ItemGroupPage, // Item Group
  B013: ItemClassPage, // Item Class
  B003: PlantPage,  // Plant
  // B005: ProcessPage, //Process
};

export default function MainLayout({ menuItems, menuLoading, menuError, children }) {
  const [collapsed,   setCollapsed]   = useState(() => {
    return localStorage.getItem("kugil_sidebar_collapsed") === "true";
  });
  
  const [openTabs,    setOpenTabs]    = useState(() => {
    try {
      const saved = localStorage.getItem("kugil_openTabs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [activeTabId, setActiveTabId] = useState(() => {
    return localStorage.getItem("kugil_activeTabId") || null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("kugil_sidebar_collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("kugil_openTabs", JSON.stringify(openTabs));
  }, [openTabs]);

  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem("kugil_activeTabId", activeTabId);
    } else {
      localStorage.removeItem("kugil_activeTabId");
    }
  }, [activeTabId]);

  // Người dùng chọn menu item → mở tab
  const handleSelectItem = (item) => {
    const tabId = item.id?.trim() ?? item.id;
    const tabName = item.name;

    setOpenTabs(prev => {
      const exists = prev.find(t => t.id === tabId);
      if (!exists) return [...prev, { id: tabId, name: tabName }];
      return prev;
    });

    setActiveTabId(tabId);
  };

  // Đóng tab
  const handleCloseTab = (tabId) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      // Nếu đóng tab đang active → active tab cuối
      if (activeTabId === tabId) {
        setActiveTabId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  // Render content dựa trên active tab
  const renderContent = () => {
    return (
      <>
        {!activeTabId && children}
        
        {openTabs.map(tab => {
          const PageComponent = PAGE_MAP[tab.id?.trim()];
          
          if (!PageComponent) {
            return (
              <div 
                key={tab.id}
                style={{ 
                  display: activeTabId === tab.id ? "block" : "none",
                  padding: 40, color: "#aaa", textAlign: "center" 
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
                <div style={{ fontSize: 16 }}>
                  Page "{tab.id}" is under development
                </div>
              </div>
            );
          }

          return (
            <div 
              key={tab.id}
              style={{ 
                display: activeTabId === tab.id ? "block" : "none",
                height: "100%" 
              }}
            >
              <PageComponent />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        menuItems={menuItems}
        loading={menuLoading}
        error={menuError}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onSelectItem={handleSelectItem}
      />

      <div className="dashboard-main">
        <Header
          openTabs={openTabs}
          activeTabId={activeTabId}
          onCloseTab={handleCloseTab}
          onSelectTab={setActiveTabId}
        />
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

