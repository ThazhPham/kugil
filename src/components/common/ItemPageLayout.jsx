import FilterPopup from "./FilterPopup";

/**
 * ItemPageLayout — Toolbar dùng chung cho mọi trang master data.
 *
 * Props:
 *  - breadcrumb: [{ label, active? }]  — các mục breadcrumb
 *  - title: string                     — tiêu đề trang (h2)
 *  - subtitle: string                  — mô tả nhỏ bên dưới title
 *  - onSearch: fn                      — nút 🔍
 *  - onClearFilter: fn                 — nút X (clear filter)
 *  - isFilterOpen: bool
 *  - onToggleFilter: fn
 *  - filterFields: []
 *  - filterValues: {}
 *  - onFilterChange: fn
 *  - extra: ReactNode                  — nút tùy biến chen vào giữa (sau filter, trước export)
 *  - children: ReactNode               — nội dung chính (DataGrid, v.v.)
 */
export default function ItemPageLayout({
  breadcrumb = [],
  title = "",
  subtitle = "",
  onSearch,
  onClearFilter,
  isFilterOpen = false,
  onToggleFilter,
  filterFields = [],
  filterValues = {},
  onFilterChange,
  extra = null,
  children,
}) {
  return (
    <div className="item-page dx-custom-styled">
      {/* ── Toolbar ── */}
      <div className="item-toolbar">
        {/* LEFT: breadcrumb + title */}
        <div className="item-toolbar__left">
          <div className="item-breadcrumb">
            <span className="item-breadcrumb__home">🏠</span>
            {breadcrumb.map((crumb, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="item-breadcrumb__sep">/</span>
                <span className={crumb.active ? "item-breadcrumb__active" : ""}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
          <h2 className="item-title">{title}</h2>
          {subtitle && <p className="item-subtitle">{subtitle}</p>}
        </div>

        {/* RIGHT: action buttons */}
        <div className="item-toolbar__right" style={{ position: "relative" }}>
          {/* Search */}
          <button className="item-action-btn" title="Search" onClick={onSearch}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>

          {/* Filter */}
          <div style={{ position: "relative" }}>
            <button className="item-action-btn" title="Filter" onClick={onToggleFilter}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
              </svg>
            </button>
            <FilterPopup
              isOpen={isFilterOpen}
              onClose={() => onToggleFilter && onToggleFilter(false)}
              fields={filterFields}
              filterValues={filterValues}
              onFilterChange={onFilterChange}
              onSearch={onSearch}
            />
          </div>

          {/* extra buttons (Add, Cancel, Save, ...) */}
          {extra}

          {/* Save */}
          {/* Clear / Delete */}
          <button className="item-action-btn" title="Clear Filter" onClick={onClearFilter}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Export Excel */}
          <button
            className="item-action-btn item-action-btn--export"
            title="Export Excel"
            style={{ padding: "0 12px", width: "auto", borderRadius: "8px" }}
          >
            <i className="dx-icon dx-icon-export" style={{ marginRight: 4 }}></i>
            <span>Export Excel</span>
            <i className="dx-icon dx-icon-spindown" style={{ fontSize: 12, marginLeft: 6 }}></i>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="item-content-wrapper" style={{ flexDirection: "column" }}>
        <div className="item-grid-section dx-custom-styled" style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
