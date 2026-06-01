import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData, getImageUrl } from "../../Api/gridService";
import FilterPopup from "../common/FilterPopup";
import DxDataGrid from "../common/DxDataGrid";
import CreateItemPanel from "./CreateItemPanel";
import "../../css/ItemPage.css";
import "../../css/DataGrid.css"; // We keep this for the pill and image CSS!
import { Selection } from "devextreme-react/data-grid";
import { CheckIcon, EditIcon, ImageIcon } from "../common/Icons";

function PlaceholderImg() {
  return (
    <div className="data-grid-img-placeholder">
      <ImageIcon />
    </div>
  );
}

export default function ItemPage() {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);

  // States for filter popup
  const [filterValues, setFilterValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // States for dropdown options
  const [class1Options, setClass1Options] = useState([]);
  const [class2Options, setClass2Options] = useState([]);
  const [class3Options, setClass3Options] = useState([]);
  const [class4Options, setClass4Options] = useState([]);
  const [class5Options, setClass5Options] = useState([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      const fetchOpts = async (objType) => {
        try {
          const res = await fetchGridData(objType, "B009", { page: 1, perPage: 500, filtering: [] });
          return (res?.Data?.List || []).map(r => ({ value: r.Code || r.ItemGroupsCode, label: r.Name }));
        } catch (err) {
          console.error(`Failed to fetch ${objType}:`, err);
          return [];
        }
      };
      Promise.all([
        fetchOpts("ItemClass1"),
        fetchOpts("ItemClass2"),
        fetchOpts("ItemClass3"),
        fetchOpts("ItemClass4"),
        fetchOpts("ItemClass5")
      ]).then(([grp, c1, c2, c3, c4, c5]) => {
        setClass1Options(c1);
        setClass2Options(c2);
        setClass3Options(c3);
        setClass4Options(c4);
        setClass5Options(c5);
      });
    };
    fetchDropdowns();
  }, []);

  const filterFields = useMemo(() => [
    { name: "ItemCode", placeholder: translate("Item"), type: "combobox", filterType: translate("Contains") },
    { name: "ItemName", placeholder: translate("Item Name"), type: "combobox", filterType: translate("Contains") },
    { name: "ItemsGroupCode", placeholder: translate("ItemsGroupCode"), type: "combobox", filterType: translate("IsEqualTo")},
    { name: "ItemClass1", placeholder: translate("Class 1"), type: "combobox", filterType: translate("IsEqualTo"), options: class1Options },
    { name: "ItemClass2", placeholder: translate("Class 2"), type: "combobox", filterType: translate("IsEqualTo"), options: class2Options },
    { name: "ItemClass3", placeholder: translate("Class 3"), type: "combobox", filterType: translate("IsEqualTo"), options: class3Options },
    { name: "ItemClass4", placeholder: translate("Class 4"), type: "combobox", filterType: translate("IsEqualTo"), options: class4Options },
    { name: "ItemClass5", placeholder: translate("Class 5"), type: "combobox", filterType: translate("IsEqualTo"), options: class5Options },
  ], [translate, class1Options, class2Options, class3Options, class4Options, class5Options]);

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(filterValues);
    setIsFilterPopupOpen(false);
    if (gridRef.current) {
      gridRef.current.instance.refresh();
    }
  };

  const handleClearFilter = () => {
    setFilterValues({});
    setAppliedFilters({});
    setIsFilterPopupOpen(false);
    if (gridRef.current) {
      gridRef.current.instance.clearFilter();
      gridRef.current.instance.refresh();
    }
  };

  /* ── Custom Cell Renderers ───────────────────────────────── */
  const renderImage = (info) => {
    const src = getImageUrl(info.value);
    return src ? (
      <img className="data-grid-img" src={src} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
    ) : <PlaceholderImg />;
  };

  const renderItemName = (info) => (
    <div className="data-grid-cell-name">
      <div className="data-grid-cell-name__code">{info.data.ItemCode}</div>
      <div className="data-grid-cell-name__desc">{info.data.ItemName || info.data.name || ""}</div>
    </div>
  );

  const renderPill = (info) => {
    const pillVal = info.value;
    if (!pillVal) return "";
    let hash = 0;
    for (let i = 0; i < pillVal.length; i++) hash = pillVal.charCodeAt(i) + ((hash << 5) - hash);
    const PILL_COLORS = [
      { bg: "#e3f0ff", color: "#2b6cb0" },
      { bg: "#e6f9ee", color: "#276749" },
      { bg: "#fef3e2", color: "#b7791f" },
      { bg: "#fce4ec", color: "#c62828" },
      { bg: "#ede7f6", color: "#5e35b1" },
      { bg: "#e0f7fa", color: "#00695c" },
    ];
    const pc = PILL_COLORS[Math.abs(hash) % PILL_COLORS.length];
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span className="data-grid-pill" style={{ background: pc.bg, color: pc.color }}>
          {pillVal}
        </span>
      </div>
    );
  };

  const renderOnHand = (info) => {
    const qty = info.data.OnHand ?? info.data.SumOnHand;
    const uom = info.data.InventoryUOMNm;
    return (
      <div className="data-grid-cell-onhand">
        {qty != null && <span className="data-grid-cell-onhand__qty">{typeof qty === "number" ? qty.toLocaleString() : qty}</span>}
        {qty == null && <span className="data-grid-cell-onhand__qty">–</span>}
        {uom && <span className="data-grid-cell-onhand__uom">{uom}</span>}
      </div>
    );
  };

  const renderBool = (info) => {
    return info.value === "Y" || info.value === true ? <CheckIcon /> : null;
  };

  const renderAction = (info) => (
    <button className="data-grid-edit-btn" title="Edit" onClick={() => handleEditRow(info.data)}>
      <EditIcon />
    </button>
  );

  const renderNumber = (info) => {
    return typeof info.value === "number" ? info.value.toLocaleString() : (info.value || "");
  };

  // Define DevExtreme Columns
  const COLUMNS = useMemo(() => {
    const defaultFilterEditorOptions = { 
      acceptCustomValue: true, 
      searchEnabled: true,
      onCustomItemCreating: (e) => {
        if (!e.customItem) {
          e.customItem = { value: e.text, label: e.text };
        }
      }
    };

    return [
      { dataField: "MainImagePath", caption: translate("Main I…"), width: 60, allowFiltering: false, cellRender: renderImage, fixed: true },
      { dataField: "ItemCode", caption: translate("Item"), width: 160, dataType: "string", cellRender: renderItemName, fixed: true },
      { 
        dataField: "ItemsGroupName", caption: translate("ItemsGroupName"), width: 160, dataType: "string", cellRender: renderPill
      },
      { 
        dataField: "ItemClass1", 
        calculateDisplayValue: (row) => row.ItemClass1Nm || row.ItemClass1 || "", 
        caption: translate("Item Class 1"), 
        width: 140, 
        dataType: "string",
        lookup: { dataSource: class1Options, valueExpr: "value", displayExpr: "label" },
        editorOptions: defaultFilterEditorOptions,
        filterEditorOptions: defaultFilterEditorOptions
      },
      { 
        dataField: "ItemClass2", 
        calculateDisplayValue: (row) => row.ItemClass2Nm || row.ItemClass2 || "", 
        caption: translate("Item Class 2"), 
        width: 140, 
        dataType: "string",
        lookup: { dataSource: class2Options, valueExpr: "value", displayExpr: "label" },
        editorOptions: defaultFilterEditorOptions,
        filterEditorOptions: defaultFilterEditorOptions
      },
      { 
        dataField: "ItemClass3", 
        calculateDisplayValue: (row) => row.ItemClass3Nm || row.ItemClass3 || "", 
        caption: translate("Item Class 3"), 
        width: 160, 
        dataType: "string",
        lookup: { dataSource: class3Options, valueExpr: "value", displayExpr: "label" },
        editorOptions: defaultFilterEditorOptions,
        filterEditorOptions: defaultFilterEditorOptions
      },
      { 
        dataField: "ItemClass4", 
        calculateDisplayValue: (row) => row.ItemClass4Nm || row.ItemClass4 || "", 
        caption: translate("Item Class 4"), 
        width: 160, 
        dataType: "string",
        lookup: { dataSource: class4Options, valueExpr: "value", displayExpr: "label" },
        editorOptions: defaultFilterEditorOptions,
        filterEditorOptions: defaultFilterEditorOptions
      },
      { 
        dataField: "ItemClass5", 
        calculateDisplayValue: (row) => row.ItemClass5Nm || row.ItemClass5 || "", 
        caption: translate("Item Class 5"), 
        width: 160, 
        dataType: "string",
        lookup: { dataSource: class5Options, valueExpr: "value", displayExpr: "label" },
        editorOptions: defaultFilterEditorOptions,
        filterEditorOptions: defaultFilterEditorOptions
      },
      { dataField: "OnHand", caption: translate("Onhand"), width: 100, dataType: "number", cellRender: renderOnHand },
      { dataField: "ManageBatchNumbers", caption: translate("Manage Batch"), width: 120, dataType: "boolean", cellRender: renderBool },
      { dataField: "ManageSerialNumbers", caption: translate("Manage Serial"), width: 120, dataType: "boolean", cellRender: renderBool },
      { dataField: "InventoryItem", caption: translate("Inventory (Y/N)"), width: 120, dataType: "boolean", cellRender: renderBool },
      { dataField: "SalesItem", caption: translate("Sale Item"), width: 100, dataType: "boolean", cellRender: renderBool },
      { dataField: "PurchaseItem", caption: translate("Purchase Item"), width: 120, dataType: "boolean", cellRender: renderBool },
      { dataField: "TemporaryUnitPrice", caption: translate("Temporary Unit Price"), width: 150, dataType: "number", cellRender: renderNumber },
      { dataField: "PricePerUnit", caption: translate("Price Per Unit"), width: 120, dataType: "number", cellRender: renderNumber },
      { dataField: "Currency", caption: translate("Currency"), width: 110, dataType: "string" },
      { dataField: "_action", caption: translate("Ac…"), width: 60, allowFiltering: false, cellRender: renderAction }
    ];
  }, [translate, class1Options, class2Options, class3Options, class4Options, class5Options]);

  const handleEditRow = (row) => {
    setEditingRow(row);
    setIsCreateOpen(true);
  };

  /* ── Remote API Fetching Logic ──────────────────────────────────────── */
  const externalFilters = useMemo(() => {
    const filters = [];
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        const fieldDef = filterFields.find(f => f.name === key);
        const op = fieldDef?.filterType === translate("Contains") ? "Contains" : "IsEqualTo";
        filters.push({ 
          ColumName: key, 
          TypeFilter: op, 
          ValueDefault: value,
          DataValue: "TEXT"
        });
      }
    });
    return filters;
  }, [appliedFilters, filterFields, translate]);

  const handleFetchData = useCallback(async (payload) => {
    return await fetchGridData("Item", "B009", payload);
  }, []);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="item-page dx-custom-styled">
      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="item-toolbar">
        <div className="item-toolbar__left">
          <div className="item-breadcrumb">
            <span className="item-breadcrumb__home">🏠</span>
            <span className="item-breadcrumb__sep">/</span>
            <span>{translate("Master")}</span>
            <span className="item-breadcrumb__sep">/</span>
            <span className="item-breadcrumb__active">{translate("Item")}</span>
          </div>
          <h2 className="item-title">{translate("ITEM LIST")}</h2>
          <p className="item-subtitle">{translate("Click on the quantity to view current stock.")}</p>
        </div>
        <div className="item-toolbar__right" style={{ position: "relative" }}>
          
          {/* Search Button */}
          <button className="item-action-btn" title={translate("Search")} onClick={handleSearch}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>

          {/* Filter Popup Button */}
          <div style={{ position: "relative" }}>
            <button className="item-action-btn" title={translate("Filter")} onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
            </button>
            <FilterPopup 
              isOpen={isFilterPopupOpen} 
              onClose={() => setIsFilterPopupOpen(false)} 
              fields={filterFields} 
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>

          {/* Delete / Clear Button */}
          <button className="item-action-btn" title={translate("Clear Filter")} onClick={handleClearFilter}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>

          {/* Add Button */}
          <button className="item-action-btn" title={translate("Add")} onClick={() => { setEditingRow(null); setIsCreateOpen(true); }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>

          {/* Excel Export Button */}
          <button className="item-action-btn item-action-btn--export" title="Export Excel">
            <i className="dx-icon dx-icon-export"></i>
            <span>Export Excel</span>
            <i className="dx-icon dx-icon-spindown dx-icon-right" style={{ fontSize: '12px', marginLeft: '2px' }}></i>
          </button>
        </div>
      </div>

      {/* ── Content Wrapper ────────────────────────────── */}
      <div className="item-content-wrapper" style={{ flexDirection: 'column' }}>
        <div className="item-grid-section dx-custom-styled" style={{ flex: 1, minHeight: 0 }}>
          <DxDataGrid
            ref={gridRef}
            columns={COLUMNS}
            fetchData={handleFetchData}
            externalFilters={externalFilters}
            keyExpr="ItemCode"
            height="100%"
          >
            <Selection mode="multiple" showCheckBoxesMode="always" />
          </DxDataGrid>
        </div>
      </div>

      {isCreateOpen && (
        <div className={`item-create-section ${isCreateExpanded ? 'full' : 'split'}`}>
          <CreateItemPanel 
            initialData={editingRow}
            mode={editingRow ? 'edit' : 'create'}
            onClose={() => { setIsCreateOpen(false); setIsCreateExpanded(false); setEditingRow(null); }}
            isExpanded={isCreateExpanded}
            onToggleExpand={() => setIsCreateExpanded(!isCreateExpanded)}
          />
        </div>
      )}
    </div>
  );
}
