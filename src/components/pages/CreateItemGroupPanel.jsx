import React, { useState, useEffect } from 'react';
import '../../css/CreateItemPanel.css';
import '../../css/CreateItemGroupPanel.css';
import { ChevronLeftIcon, ChevronRightIcon, CloseFillIcon, SaveIcon, CheckMarkLineIcon } from "../common/Icons";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import DxDataGrid from "../common/DxDataGrid";
import { Selection } from "devextreme-react/data-grid";
import PopupItemClass from "./PopupItemClass";
import { fetchGridData } from "../../Api/gridService";

export default function CreateItemGroupPanel({ onClose, onSave, isExpanded, onToggleExpand, initialData, mode = 'create' }) {
  const { translate } = useAutoI18n();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [gridDetails, setGridDetails] = useState([]);
  const detailGridRef = React.useRef(null);
  const [errors, setErrors] = useState({});

  // const gridRef = useRef(null);  

  const [form, setForm] = useState({
    Number: '',
    GroupCode: '',
    GroupName: '',
    GroupLevel: 1,
    OrderNum: 1,
    PurchaseItem: false,
    SaleItem: false,
    InventoryItem: false,
    ImportYN: false,
    PhantomItem: false,
    QCYN: false,
    BatchManage: false,
    SerialManage: false,
    UseYN: true
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        Number: initialData.Number || '',
        GroupCode: initialData.GroupCode || '',
        GroupName: initialData.GroupName || '',
        GroupLevel: initialData.GroupLevel || 1,
        OrderNum: initialData.OrderNum || 1,
        PurchaseItem: initialData.PurchaseItem || false,
        SaleItem: initialData.SaleItem || false,
        InventoryItem: initialData.InventoryItem || false,
        ImportYN: initialData.ImportYN || false,
        PhantomItem: initialData.PhantomItem || false,
        QCYN: initialData.QCYN || false,
        BatchManage: initialData.BatchManage || false,
        SerialManage: initialData.SerialManage || false,
        UseYN: initialData.UseYN !== undefined ? initialData.UseYN : true
      });
      const rawDetails = initialData.Details || [];
      console.log("=== DỮ LIỆU DETAILS TỪ API ===", rawDetails);
      
      const safeDetails = [];
      const seen = new Set();
      
      rawDetails.forEach((d, index) => {
        const code = d.ItemClass || d.Code || d.ItemClassCode || d.ClassCode || `temp_${index}`;
        if (!seen.has(code)) {
          seen.add(code);
          safeDetails.push({
            ...d,
            Code: code
          });
        }
      });
      
      setGridDetails(safeDetails);
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const handleSelectClass = (selectedRows) => {
    const newDetails = [...gridDetails];
    selectedRows.forEach(row => {
      if (!newDetails.find(d => d.Code === row.Code)) {
        newDetails.push(row);
      }
    });
    setGridDetails(newDetails);
  };

  const handleDeleteClass = (e) => {
    e.preventDefault();
    const selectedRowKeys = detailGridRef.current?.instance().getSelectedRowKeys();
    if (selectedRowKeys && selectedRowKeys.length > 0) {
      setGridDetails(gridDetails.filter(row => !selectedRowKeys.includes(row.Code)));
    } else {
      alert(translate("Vui lòng chọn ít nhất 1 dòng để xóa."));
    }
  };

    const handleSaveClick = () => {
    const newErrors = {};
    if (!form.GroupCode || form.GroupCode.trim() === '') newErrors.GroupCode = true;
    if (!form.GroupName || form.GroupName.trim() === '') newErrors.GroupName = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(translate("Vui lòng nhập đầy đủ các trường bắt buộc (*)"));
      return; 
    }
    setErrors({});
  
    // Ép kiểu các trường rỗng về số chuẩn trước khi gửi
    const payloadToSave = {
      ...form,
      Number: form.Number ? Number(form.Number) : 0,
      GroupLevel: form.GroupLevel ? Number(form.GroupLevel) : 1,
      OrderNum: form.OrderNum ? Number(form.OrderNum) : 1,
      Details: gridDetails.map(d => ({
        ...d,
        ItemClass: d.ItemClass || d.Code
      }))
    };
    // Gửi ra ngoài
    onSave(payloadToSave);
  };

  return (
    <div className="create-panel">
      <div className="create-panel-header">
        <h3 className="create-panel-title">{mode === 'edit' ? translate('DETAIL') : translate('CREATE')}</h3>
        <div className="create-panel-actions">
          <button className="create-panel-btn" onClick={onToggleExpand} title={isExpanded ? translate("Thu nhỏ") : translate("Phóng to")}>
            {isExpanded ? (
              <ChevronLeftIcon width="16" height="16" />
            ) : (
              <ChevronRightIcon width="16" height="16" />
            )}
          </button>
          <button className="create-panel-btn create-panel-btn--close" onClick={onClose} title={translate("Đóng")}>
            <CloseFillIcon width="16" height="16" />
          </button>
        </div>
      </div>

      <div className="create-panel-content create-item-group-content">
        <div className="create-panel-form-grid create-item-group-grid">
          
          <div className="form-group">
            <div className="floating-input-wrapper">
              <input type="text" className="floating-input" style={errors.GroupNumber ? { borderColor: '#f44336' } : {}} placeholder=" " value={form.Number} onChange={(e) => handleInputChange('Number', e.target.value)}  />
              <label className="floating-label">{translate("Group Number")}</label>
            </div>
          </div>
          <div className="form-group">
            <div className="floating-input-wrapper">
              <input type="text" className="floating-input" style={errors.GroupCode ? { borderColor: '#f44336' } : {}} placeholder=" " value={form.GroupCode} onChange={(e) => handleInputChange('GroupCode', e.target.value)} />
              <label className="floating-label" style={errors.GroupCode ? { color: '#f44336' } : {}}>{translate("Group Code")} *</label>
            </div>
          </div>
          <div className="form-group">
            <div className="floating-input-wrapper">
              <input type="text" className="floating-input" style={errors.GroupName ? { borderColor: '#f44336' } : {}} placeholder=" " value={form.GroupName} onChange={(e) => handleInputChange('GroupName', e.target.value)} />
              <label className="floating-label" style={errors.GroupName ? { color: '#f44336' } : {}}>{translate("Group Name")} *</label>
            </div>
          </div>

          <div className="form-group">
            <div className="floating-input-wrapper">
              <input type="number" className="floating-input" min="0" placeholder=" " value={form.GroupLevel} onChange={(e) => handleInputChange('GroupLevel', e.target.value)} />
              <label className="floating-label">{translate("Level")}</label>
            </div>
          </div>
          <div className="form-group">
            <div className="floating-input-wrapper">
              <input type="number" className="floating-input" min="0" placeholder=" " value={form.OrderNum} onChange={(e) => handleInputChange('OrderNum', e.target.value)} />
              <label className="floating-label">{translate("Sort Order")}</label>
            </div>
          </div>
          <div className="form-group create-item-group-form-group-checkbox">
            <label className="form-checkbox create-item-group-checkbox-inline">
              <input type="checkbox" checked={form.PurchaseItem} onChange={(e) => handleInputChange('PurchaseItem', e.target.checked)} />
              <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
              {translate("Purchase Item")}
            </label>
          </div>
        </div>

        <div className="form-checkbox-group create-item-group-checkbox-grid">
          <label className="form-checkbox">
            <input type="checkbox" checked={form.SaleItem} onChange={(e) => handleInputChange('SaleItem', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Sale Item")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.InventoryItem} onChange={(e) => handleInputChange('InventoryItem', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Inventory Mgmt")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.ImportYN} onChange={(e) => handleInputChange('ImportYN', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("ImportYN")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.PhantomItem} onChange={(e) => handleInputChange('PhantomItem', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Phantom Item")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.QCYN} onChange={(e) => handleInputChange('QCYN', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("QC (Y/N)")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.BatchManage} onChange={(e) => handleInputChange('BatchManage', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Batch Manage")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.SerialManage} onChange={(e) => handleInputChange('SerialManage', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Serial Manage")}
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={form.UseYN} onChange={(e) => handleInputChange('UseYN', e.target.checked)} />
            <div className="form-checkbox-box"><CheckMarkLineIcon /></div>
            {translate("Active")}
          </label>
        </div>

        <div className="group-class-section">
          <div className="group-class-header">
            <div>
              <h4 className="group-class-title">{translate("GROUP CLASS")}</h4>
              <p className="group-class-desc">{translate("Click 'Add' to open Item Class and choose an item.")}</p>
            </div>
            <div className="group-class-actions">
              <button className="group-class-btn" title={translate("Add")} onClick={(e) => { e.preventDefault(); setIsPopupOpen(true); }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              </button>
              <button className="group-class-btn" title={translate("Delete")} onClick={handleDeleteClass}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          
          <div className="group-class-grid-container">
            <DxDataGrid
              ref={detailGridRef}
              data={gridDetails}
              columns={[
                { dataField: "Code", caption: translate("Code"), alignment: "left" }
              ]}
              keyExpr="Code"
              height="100%"
              showBorders={false}
              showFilterRow={false}
              showPagination={true}
              
            >
              <Selection mode="multiple" showCheckBoxesMode="always" />
            </DxDataGrid>
          </div>
        </div>

      </div>

      <div className="create-panel-footer">
        <button className="create-panel-save-btn"  onClick={handleSaveClick} >
          <SaveIcon width="16" height="16" fill="currentColor" />
          {translate("Save")}
        </button>
      </div>

      <PopupItemClass 
        isOpen={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)} 
        onSelect={handleSelectClass} 
       
      />
    </div>
  );
}
