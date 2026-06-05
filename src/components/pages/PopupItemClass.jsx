import React, { useRef } from 'react';
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData } from "../../Api/gridService";
import DxDataGrid from "../common/DxDataGrid";
import { Selection } from "devextreme-react/data-grid";
import { CloseFillIcon } from "../common/Icons";

export default function PopupItemClass({ isOpen, onClose, onSelect, onEditorPreparing, onSelectionChanged, onRowPrepared }) {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);
  if (!isOpen) return null;

  const handleFetchData = (payload) => fetchGridData("ItemClass", "B013", payload);

  const COLUMNS = [
    { dataField: "Code", caption: translate("Code"), alignment: "center", width: 100 },
    { dataField: "Name", caption: translate("Name") },
    { dataField: "Remark", caption: translate("Remark") },
    { 
      dataField: "UseYN", 
      caption: translate("Active"), 
      dataType: "boolean", 
      width: 80, 
      alignment: "center",
      cellRender: (info) => info.data.UseYN ? <span style={{ color: '#9d3a77' }}>✓</span> : null 
    },
    { dataField: "CreateBy", caption: translate("CreateBy"), alignment: "center" },
    {
      dataField: "CreateDate",
      caption: translate("Create Date"),
      width: 150,
      dataType: "string",
      alignment: "center"
    },
    {
      dataField: "UpdateBy",
      caption: translate("Update By"),
      width: 150,
      dataType: "string",
      alignment: "center"
    },
    {
      dataField: "UpdateDate",
      caption: translate("Update Date"),
      width: 150,
      dataType: "string",
      alignment: "center"
    }, 
    {
      dataField: "totalRows",
      caption: translate("Total Rows"),
      width: 150,
      dataType: "number",
      alignment: "center"
    }
  ];

  const handleSelectClick = () => {
    const selectedRows = gridRef.current?.instance().getSelectedRowsData();
    if (onSelect && selectedRows && selectedRows.length > 0) {
      onSelect(selectedRows);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '700px', height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#9d3a77', color: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{translate("Item Class")}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <CloseFillIcon width="16" height="16" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#9d3a77', fontSize: '14px', fontWeight: 600 }}>{translate("RESULT")}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{translate("Select rows then click Select button")}</p>
          </div>
          
          <div style={{ flex: 1, border: '1px solid #eee', minHeight: 0 }}>
            <DxDataGrid
              ref={gridRef}
              columns={COLUMNS}
              fetchData={handleFetchData}
              keyExpr="Code"
              height="100%"
              showBorders={false}
              onEditorPreparing={onEditorPreparing} 
              onSelectionChanged={onSelectionChanged}
              onRowPrepared={onRowPrepared}
            >
              <Selection mode="multiple" showCheckBoxesMode="always" />
            </DxDataGrid>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSelectClick} style={{ padding: '8px 24px', backgroundColor: '#fff', color: '#9d3a77', border: '1px solid #9d3a77', borderRadius: '20px', cursor: 'pointer', fontWeight: 500 }}>
            {translate("Select")}
          </button>
        </div>

      </div>
    </div>
  );
}
