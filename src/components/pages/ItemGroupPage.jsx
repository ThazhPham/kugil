import { useState, useMemo, useRef, useCallback } from "react";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData, addGridData, updateGridData } from "../../Api/gridService";
import ItemPageLayout from "../common/ItemPageDataGrid.jsx";
import DxDataGrid from "../common/DxDataGrid";
import CreateItemGroupPanel from "./CreateItemGroupPanel";
import "../../css/ItemPage.css";
import "../../css/DataGrid.css";
import { Selection, Editing } from "devextreme-react/data-grid";
import { toast } from 'react-hot-toast'; // Hoặc thư viện toast mà project bạn dùng


export default function ItemGroupPage() {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);

  const [filterValues, setFilterValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const filterFields = useMemo(() => [
    { name: "Number",  placeholder: translate("Group Number"), type: "text", filterType: translate("Contains") },
    { name: "GroupCode",  placeholder: translate("Group Code"), type: "text", filterType: translate("Contains") },
  ], [translate]);

  /* ── handlers ── */
  const handleFilterChange = (key, value) =>
    setFilterValues(prev => ({ ...prev, [key]: value }));

  const handleSearch = () => {
    setAppliedFilters(filterValues);
    setIsFilterPopupOpen(false);
    gridRef.current?.instance().refresh();
  };

  const handleClearFilter = () => {
    setFilterValues({});
    setAppliedFilters({});
    setIsFilterPopupOpen(false);
    gridRef.current?.instance().clearFilter();
    gridRef.current?.instance().refresh();
  };

  const handleSavePanel = useCallback((payloadFromPanel) => {
    // Validate duplicate GroupCode (kiểm tra trùng key trên lưới hiện tại)
    const currentItems = gridRef.current?.instance().getDataSource().items() || [];
    const isDuplicate = currentItems.some(
     item => item.GroupCode === payloadFromPanel.GroupCode && item.GroupCode !== editingRow?.GroupCode ||
     item.GroupNumber === payloadFromPanel.GroupNumber && item.GroupNumber !== editingRow?.GroupNumber
    );
    
    if (isDuplicate) {
      alert(translate("Mã Group Code này đã tồn tại, vui lòng nhập mã khác!!!!"))|| alert(translate("Mã Group Number này đã tồn tại, vui lòng nhập số khác!"));
      return;
    }

    if (editingRow) {
      updateGridData("ItemGroup", "B012", payloadFromPanel)
        .then((res) => {
          if (res && res.Success !== false) {
             // Giữ nguyên panel, cập nhật lại editingRow để đồng bộ data mới nhất
             setEditingRow(payloadFromPanel);
             gridRef.current?.instance().refresh(); 
             if (res.Success || res.isSuccessed) {
              toast.success("Đã lưu thay đổi!");
             }
          } else {
             alert(translate("Lỗi khi cập nhật dữ liệu: ") + (res?.ReturnMess || "Unknown error"));
          }
        })
        .catch((err) => {
          alert(translate("Lỗi kết nối khi cập nhật: ") + err.message);
        });
    } else {
      addGridData("ItemGroup", "B012", payloadFromPanel)
        .then((res) => {
          if (res && res.Success !== false) {
             setIsCreateOpen(false);
             setIsCreateExpanded(false);
             setEditingRow(null);
             gridRef.current?.instance().refresh(); 
          } else {
             alert(translate("Lỗi khi thêm mới dữ liệu: ") + (res?.ReturnMess || "Unknown error"));
          }
        })
        .catch((err) => {
          alert(translate("Lỗi kết nối khi thêm mới: ") + err.message);
        });
    }
  }, [translate, editingRow]);

  /* ── columns ── */
  const COLUMNS = useMemo(() => [
    {
      dataField: "Number",
      caption: translate("Group Number"),
      width: 150,
      dataType: "number",
      alignment: "center",
      validationRules: [{ type: "required" }]
    },
    { 
      dataField: "GroupCode",  
      caption: translate("Group Code"), 
      minWidth: 300, 
      dataType: "string",
      validationRules: [{ type: "required" }],
      cellRender: (info) => {
        return (
          <div className="data-grid-cell-name">
            <div className="data-grid-cell-name__code">{info.data.GroupCode || ""}</div>
            <div className="data-grid-cell-name__desc">{info.data.GroupName || ""}</div>
          </div>
        );
      }
    },
    { 
      dataField: "GroupLevel",  
      caption: translate("Level"), 
      width: 150, 
      dataType: "number",
      alignment: "center"
    },
    { 
      dataField: "OrderNum",  
      caption: translate("Sort Order"), 
      width: 150, 
      dataType: "number",
      alignment: "center"
    },
    { 
      dataField: "PurchaseItem", 
      caption: translate("Purchase Item"),     
      width: 150,    
      dataType: "boolean", 
      alignment: "center" 
    },
    {
      dataField: "SaleItem", 
      caption: translate("Sale Item"),     
      width: 150,    
      dataType: "boolean", 
      alignment: "center"
    },
    {
      dataField: "InventoryItem",
      caption: translate("Inventory Item"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
    {
      dataField: "ImportYN",
      caption: translate("Import Item"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
    {
      dataField: "PhantomItem",
      caption: translate("Phantom Item"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
    {
      dataField: "QCYN",
      caption: translate("QC Item"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
    {
      dataField: "BatchManage",
      caption: translate("Batch Manage"),
      width: 150,
      dataType: "boolean",
    },
    {
      dataField: "SerialManage",
      caption: translate("Serial Manage"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
    {
      dataField: "UseYN",
      caption: translate("Active"),
      width: 150,
      dataType: "boolean",
      alignment: "center"
    },
  ], [translate]);

  /* ── remote fetch ── */
  const externalFilters = useMemo(() => {
    const out = [];
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        out.push({ ColumName: key, TypeFilter: "Contains", ValueDefault: value, DataValue: "TEXT" });
      }
    });
    return out;
  }, [appliedFilters]);

  const handleFetchData = useCallback(
    (payload) => fetchGridData("ItemGroup", "B012", payload),
    []
  );

  /* ── extra buttons (passed into toolbar via ItemPageLayout) ── */
  const extraButtons = (
    <>
      {/* Add */}
      <button
        className="item-action-btn"
        title={translate("Add")}
        onClick={() => { setEditingRow(null); setIsCreateOpen(true); }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </>
  );

   const rightPanel = isCreateOpen ? (
    <CreateItemGroupPanel
      initialData={editingRow}
      mode={editingRow ? 'edit' : 'create'}
      onClose={() => {
        if (editingRow === null) {
          setIsCreateOpen(false);
          setIsCreateExpanded(false);   
        }
        setEditingRow(null);  
       }}
      onSave={handleSavePanel} 
      isExpanded={isCreateExpanded}
      onToggleExpand={() => setIsCreateExpanded(!isCreateExpanded)}
    />
  ) : null;

  /* ── render ── */
  return (
    <ItemPageLayout
      breadcrumb={[
        { label: translate("Master Data") },
        { label: translate("Item Group"), active: true },
      ]}
      title={translate("ITEM GROUP")}
      subtitle={translate("itemGroupMasterHint")}
      onSearch={handleSearch}
      onClearFilter={handleClearFilter}
      isFilterOpen={isFilterPopupOpen}
      onToggleFilter={() => setIsFilterPopupOpen(v => !v)}
      filterFields={filterFields}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      extra={extraButtons}
      rightPanel={rightPanel}
      isRightPanelExpanded={isCreateExpanded}
    >
      <DxDataGrid
        ref={gridRef}
        columns={COLUMNS}
        fetchData={handleFetchData}
        externalFilters={externalFilters}
        keyExpr="Number" // Sử dụng cột duy nhất làm Key để tránh lỗi dính selection khi GroupCode trùng
        height="100%"
        onRowDblClick={(e) => {
          if (e.rowType === "data") {
            setEditingRow(e.data);
            setIsCreateOpen(true);
          }
        }}
      >
        <Selection mode="multiple" showCheckBoxesMode="always" />
        <Editing
          mode="batch"
          allowAdding={false}
          allowUpdating={false}
          allowDeleting={false}
          newRowPosition="first"
          doubleClickToEdit={false}

        />
      </DxDataGrid>
    </ItemPageLayout>
  );
}