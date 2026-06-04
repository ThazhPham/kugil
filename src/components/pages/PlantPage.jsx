import React, { useState, useMemo, useRef, useCallback } from "react";
import ItemPageLayout from "../common/ItemPageDataGrid.jsx";
import DxDataGrid from "../common/DxDataGrid";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData, saveGridDataPlant } from "../../Api/gridService";
import { CheckIcon, EditIcon } from "../common/Icons";
import "../../css/ItemPage.css"; // Reuse ItemPage styling for consistency
import { Selection, Editing, SearchPanel } from "devextreme-react/data-grid";
import { Icons } from "devextreme-react/data-grid";

export default function PlantPage() {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);
  // States for filter popup
  const [filterValues, setFilterValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  // Popup fields
  const filterFields = useMemo(() => [
    { name: "PlantCd", placeholder: translate("Code"), type: "text", filterType: translate("Contains") },
    { name: "PlantNm", placeholder: translate("Name"), type: "text", filterType: translate("Contains") },
    { 
      name: "Location", 
      placeholder: translate("Location"), 
      editorType: "dxSelectBox", 
      label: { text: translate("Location")}, 
      editorOptions: {
        placeholder: translate("Location"),
        items: "id", 
        
        // --- 2 DÒNG QUAN TRỌNG NHẤT ---
        valueExpr: "id",      // Key lấy giá trị. Khi bạn chọn Malaysia, SelectBox sẽ tự lấy ID là "MYS" để fill vào value
        displayExpr: "id",  // Hiển thị chữ "Malaysia" lên thanh filter
        
        searchEnabled: true,
        searchMode: "contains",
        searchExpr: "id",
        searchTimeout: 200
      }
    },
    { name: "Address", placeholder: translate("Address"), type: "text", filterType: translate("Contains") },
  ], [translate]);


  const handleAddrow = () => {
    gridRef.current?.instance().addRow();
  };
  
  const handleSave = () =>{
    const grid = gridRef.current?.instance();
    if (grid) {
      const controller = grid.getController("validating");
     if (controller && controller.validate) {
      controller.validate(true);
     }
     grid.saveEditData();
    }
  };
  
  const handleSaving = useCallback ((e) => {
    e.cancel = true;
    
    if (e.changes.length) {
      const gridItems = e.component.getDataSource().items();

      const dataToSave = e.changes.map((change, index) => {
      if (change.type === "insert") {
        const {_rowId, ...rest } = change.data || {};
        return {
          ...rest,
          UseYN: rest.UseYN ?? true,
          _rowIndex: index
      }; 
    } else if (change.type === "update") {
        const original = gridItems.find(item => item.PlantCd === change.key || item._rowId === change.key) || {};
        return{
          ...original,
          ...change.data,
          _rowIndex: index
        }; 
      }
      return change.data;
    });

     e.promise = saveGridDataPlant("Plant", "B003", dataToSave)
            .then((res) => {
              if (res && res.Success !== false) { // Có thể tuỳ chỉnh theo response thực tế
                e.component.cancelEditData();
                e.component.refresh();
              } else {
                alert(translate("Lỗi khi lưu dữ liệu: ") + (res?.ReturnMess || "Unknown error"));
              }
            })
            .catch((err) => {
              alert(translate("Lỗi kết nối khi lưu: ") + err.message);
              throw err;
            });
        }
  }, [translate]);
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

  const handleEditRow = (rowData) => {
    // TODO: Implement Edit popup/panel logic here later
    console.log("Edit Plant:", rowData);
  };

  /* ── Custom Cell Renderers ───────────────────────────────── */
  const renderBool = (info) => {
    return info.value === "Y" || info.value === true ? <CheckIcon /> : null;
  };

  const renderAction = (info) => (
    <button className="data-grid-edit-btn" title="Edit" onClick={() => handleEditRow(info.data)}>
      <EditIcon />
    </button>
  );

  // Define DevExtreme Columns
  const COLUMNS = useMemo(() => [
    { dataField: "PlantCd", caption: translate("Code"), allowFiltering:false  },
    { dataField: "PlantNm", caption: translate("Name"),  },
    { dataField: "Location", caption: translate("Location"),  },
    { dataField: "Address", caption: translate("Address"),  },
    { dataField: "UseYN", caption: translate("Active"),  },
    { dataField: "_action", caption: translate("Actions"), allowFiltering: false, 
      type: "buttons",
      buttons: [
        "edit",
        Icons
      ]

    }
      
  ], [translate]);

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

  const handleFetchData = useCallback((payload) => {
    return fetchGridData("Plant", "B003", payload);
  }, []);

  // Toolbar extra buttons
  const extraToolbarButtons = (
    <>
      <button className="item-action-btn item-action-btn--primary" title="Add" onClick={handleAddrow}>
        <i className="dx-icon dx-icon-add" style={{ fontSize: 16 }}></i>
      </button>
      <button className="item-action-btn" title="Save" onClick={handleSave} >
        <i className="dx-icon dx-icon-save" style={{ fontSize: 16 }}></i>
      </button>
    </>
  );

  return (
    <ItemPageLayout
      breadcrumb={[
        { label: translate("Master Data") },
        { label: translate("Plant"), active: true }
      ]}
      title={translate("PLANT")}
      subtitle={translate("Planthint")}
      onSearch={handleSearch}
      onClearFilter={handleClearFilter}
      isFilterOpen={isFilterPopupOpen}
      onToggleFilter={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
      filterFields={filterFields}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      extra={extraToolbarButtons}
    >
      <DxDataGrid
        ref={gridRef}
        columns={COLUMNS}
        fetchData={handleFetchData}
        externalFilters={externalFilters}
        keyExpr="PlantCd"
        disableRowClickSelection={false}
        onSaving={handleSaving}
        onDbRowClick={(e) => {
          if (e.rowType === "data") {
            handleEditRow(e.data);
          }
        }}
        onInitNewRow={(e) => {
        e.data._rowId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        e.data.PlantCd = "";
        e.data.PlantNm = "";
        e.data.Location = "";
        e.data.Address = "";
        e.data.UseYN = "True";
      }}
      >
        <Selection mode="multiple" showCheckBoxesMode="always" />
        <Editing
          mode="row"
          useIcons={true}
          allowAdding={false}
          allowUpdating={true}
          allowDeleting={false}
          newRowPosition="first"
          onDbRowClick={true}
        />
      </DxDataGrid>
    </ItemPageLayout>
  );
}
