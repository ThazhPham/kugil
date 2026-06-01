import { useState, useMemo, useRef, useCallback } from "react";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData } from "../../Api/gridService";
import ItemPageLayout from "../common/ItemPageDataGrid.jsx";
import DxDataGrid from "../common/DxDataGrid";
import "../../css/ItemPage.css";
import "../../css/DataGrid.css";
import { Selection, Editing } from "devextreme-react/data-grid";
import { EditIcon } from "../common/Icons";

export default function ItemClassPage() {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);

  const [filterValues, setFilterValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  const filterFields = useMemo(() => [
    { name: "Code",  placeholder: translate("Code"),       type: "text", filterType: translate("Contains") },
    { name: "Name",  placeholder: translate("Class Name"), type: "text", filterType: translate("Contains") },
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

  const handleMultipleRows = (count) => {
    const grid = gridRef.current?.instance();
    if (!grid) return;

    for (let i = 0; i < count; i++) {
      grid.addRow();
    }
  };
  const handleCancel = () => gridRef.current?.instance().cancelEditData();

  /* ── columns ── */
  const COLUMNS = useMemo(() => [
    {
      dataField: "Code",
      caption: translate("Code *"),
      width: 450,
      dataType: "string",
      fixed:  true,
      sortOrder: "desc",
      alignment: "center",
      validationRules: [{ type: "required" }],
      allowEditing: false,
    },
    { 
      dataField: "Name",  
      caption: translate("Class Name *"), 
      minWidth: 300, 
      dataType: "string",
      validationRules: [{ type: "required" }]
    },
    { dataField: "UseYN", caption: translate("Active"),     width: 150,    dataType: "boolean", alignment: "center" },
    { dataField: "_action", caption: translate("Actions"),  width: 100,    allowFiltering: false, allowEditing: false,
      alignment: "center",
      cellRender: ({data, rowIndex}) => {
        return ( 
        <button
          className="btn-grid-icon"
          title={translate("Edit")}
          onClick={() => { gridRef.current?.instance().editRow(rowIndex); }}
        >
           <EditIcon />
        </button>
        )
      },
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
    (payload) => fetchGridData("ItemClass", "B013", payload),
    []
  );

  /* ── extra buttons (passed into toolbar via ItemPageLayout) ── */
  const extraButtons = (
    <>
      {/* Add — thêm dòng mới ở đầu DataGrid */}
      <button
        className="item-action-btn"
        title={translate("Add")}
        onClick={() => handleMultipleRows(1)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>

      {/* Save */}
      <button
        className="item-action-btn"
        title={translate("Save")}
        onClick={() => gridRef.current?.instance().saveEditData()}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
      </button>

      {/* Cancel — hủy dòng mới đang thêm */}
      <button
        className="item-action-btn"
        title={translate("Cancel")}
        onClick={handleCancel}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
        </svg>
      </button>
    </>
  );

  /* ── render ── */
  return (
    <ItemPageLayout
      breadcrumb={[
        { label: translate("Master Data") },
        { label: translate("Item Class"), active: true },
      ]}
      title={translate("ITEM CLASS")}
      subtitle={translate("itemClassMasterHint")}
      onSearch={handleSearch}
      onClearFilter={handleClearFilter}
      isFilterOpen={isFilterPopupOpen}
      onToggleFilter={() => setIsFilterPopupOpen(v => !v)}
      filterFields={filterFields}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      extra={extraButtons}
    >
      <DxDataGrid
        ref={gridRef}
        columns={COLUMNS}
        fetchData={handleFetchData}
        externalFilters={externalFilters}
        keyExpr="Code"
        height="100%"
        
        onInitNewRow={(e) => {
          e.data.Code = "";
          e.data.Name = "";
        }}
        
      >
        
        <Selection mode="multiple" showCheckBoxesMode="always" />
        <Editing
          mode="batch"
          allowAdding={false}
          allowUpdating={true}
          allowDeleting={false}
          newRowPosition="first"
          startEditAction="dblClick"
        />
      </DxDataGrid>
    </ItemPageLayout>
  );
}
