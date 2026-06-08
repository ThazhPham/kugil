import { useState, useMemo, useRef, useCallback } from "react";
import { useAutoI18n } from "../../i18n/useAutoI18n";
import { fetchGridData, saveGridData } from "../../Api/gridService";
import ItemPageLayout from "../common/ItemPageDataGrid.jsx";
import DxDataGrid from "../common/DxDataGrid";
import "../../css/ItemPage.css";
import "../../css/DataGrid.css";
import { Selection, Editing, Icons, Change } from "devextreme-react/data-grid";
import { EditIcon } from "../common/Icons";
import { Text } from "devextreme-react/cjs/circular-gauge.js";

export default function ItemClassPage() {
  const { translate } = useAutoI18n();
  const gridRef = useRef(null);

  const [filterValues, setFilterValues] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    if (!isEditing) gridRef.current?.instance().refresh();
  };

  const handleClearFilter = () => {
    setFilterValues({});
    setAppliedFilters({});
    setIsFilterPopupOpen(false);
    if (!isEditing) {
      gridRef.current?.instance().clearFilter();
      gridRef.current?.instance().refresh();
    }
  };

  const handleSave = () => {
    const grid = gridRef.current?.instance();
    if (!grid) return;

    // 1. Chạy validate của DevExtreme để nó tự động bôi đỏ các ô rỗng
    const controller = grid.getController("validating");
    if (controller && controller.validate) {
      controller.validate(true);
    }

    // 2. Chỉ tìm ô lỗi để focus chuột (Không dùng vòng lặp for)
    const changes = grid.option("editing.changes");

    if (changes && changes.length > 0) {
      // --- ĐIỀU KIỆN 1 (Ưu tiên): Kiểm tra dòng mà con trỏ chuột vừa thao tác (dòng cuối mảng changes) ---
      const lastChange = changes[changes.length - 1];
      let activeErrorRow = null;

      if (lastChange && (lastChange.type === "insert" || lastChange.type === "update")) {
          const c = lastChange.data.Code;
          const n = lastChange.data.Name;
          const isCodeMissing = lastChange.type === "insert" ? (!c || c.trim() === "") : (c !== undefined && (!c || c.trim() === ""));
          const isNameMissing = lastChange.type === "insert" ? (!n || n.trim() === "") : (n !== undefined && (!n || n.trim() === ""));
          
          if (isCodeMissing || isNameMissing) {
              activeErrorRow = lastChange; // Dòng hiện tại bị lỗi, ưu tiên bắt nó trước
          }
      }

      // --- ĐIỀU KIỆN 2 (Dự phòng): Nếu dòng hiện tại không lỗi, dùng 'find' quét các dòng khác từ trên xuống ---
      const errorChange = activeErrorRow || changes.find(change => {
        if (change.type !== "insert" && change.type !== "update") return false;
        
        const code = change.data.Code;
        const name = change.data.Name;
        
        if (change.type === "insert") {
            return (!code || code.trim() === "") || (!name || name.trim() === "");
        }
        return (code !== undefined && (!code || code.trim() === "")) || 
               (name !== undefined && (!name || name.trim() === ""));
      });

      // --- XỬ LÝ FOCUS VÀO CỘT LỖI ---
      if (errorChange) {
          // Ưu tiên ngang: Check Code trước, xong rồi mới đến Name (ClassName)
          let missingField = "Code"; 
          const code = errorChange.data.Code;
          
          if (errorChange.type === "insert") {
              if (code && code.trim() !== "") missingField = "Name";
          } else {
              if (code !== undefined && code.trim() !== "") missingField = "Name";
          }

          const rowIndex = grid.getRowIndexByKey(errorChange.key);
          if (rowIndex >= 0) {
              // --- Áp dụng "Cách 3": Bới móc DOM HTML để ép nháy chuột 100% ---
              const cellElement = grid.getCellElement(rowIndex, missingField);
              if (cellElement) {
                  const inputElement = cellElement.querySelector('input, textarea');
                  if (inputElement) {
                      inputElement.focus();
                  } else {
                      grid.editCell(rowIndex, missingField); // Dự phòng nếu chưa vẽ kịp thẻ input
                  }
              } else {
                  grid.editCell(rowIndex, missingField);
              }
          }
          
          return; // Khóa Save lại, chừng nào điền xong mới cho đi tiếp
      }
    }

    // 3. Nếu không lỗi mới lưu
      grid.saveEditData();
  };


  const handleSaving = useCallback((e) => {
    e.cancel = true; // Ngăn chặn DevExtreme tự động gọi custom store mặc định

    if (e.changes.length) {
      const gridItems = e.component.getDataSource().items();
      

      // Dữ liệu đã được DevExtreme validate an toàn (bao gồm cả kiểm tra trùng bằng validationRules).
      // Giờ chỉ việc gom data để gửi xuống Backend:

      // Chuyển đổi e.changes sang mảng các object phẳng (phù hợp với backend)
      const dataToSave = e.changes.map((change, index) => {
        if (change.type === "insert") {
          // remove temporary _rowId before sending to backend
          const { _rowId, ...rest } = change.data || {};
          return {
            ...rest,
            UseYN: rest.UseYN ?? true,
            _rowIndex: index
          };
        } else if (change.type === "update") {
          // Lấy dòng dữ liệu gốc từ grid và gộp với dữ liệu mới thay đổi
          const original = gridItems.find(item => item.Code === change.key || item._rowId === change.key) || {};
          return {
            ...original,
            ...change.data,
            _rowIndex: index
          };
        }
        return change.data;
      });

      // Ép DataGrid hiển thị hiệu ứng Loading mờ màn hình
      e.component.beginCustomLoading(translate("Đang lưu dữ liệu..."));

      e.promise = saveGridData("ItemClass", "B013", dataToSave)
        .then((res) => {
          if (res && res.Success !== false) { 
            e.component.cancelEditData();
            // Lệnh refresh() sẽ tự động kéo lại hàm Fetch và tự động hiện Loading tiếp
            e.component.refresh();
          } else {
            alert(translate("Lỗi khi lưu dữ liệu: ") + (res?.ReturnMess || "Unknown error"));
          }
        })
        .catch((err) => {
          alert(translate("Lỗi kết nối khi lưu: ") + err.message);
          throw err;
        })
        .finally(() => {
          // Tắt hiệu ứng Loading thủ công khi Promise kết thúc
          e.component.endCustomLoading();
        });
    }
  }, [translate]);

  const handleAddRow = () => {
    gridRef.current?.instance().addRow();
  };
  const handleCancel = () => {
    gridRef.current?.instance().cancelEditData();
    setIsEditing(false);
  };

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
      allowEditing: (options) => options?.row?.isNewRow === true,
      editorOptions: {
        valueChangeEvent: 'input',
        acceptCustomValue: true,
        inputAttr: {
          autoComplete: 'off',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: 'false'
        }
      },
      validationRules: [
        { type: "required", message: translate("Vui lòng nhập Mã!") },
        {
          type: "custom",
          message: translate("Mã Code đã tồn tại!"),
          validationCallback: (e) => {
            if (!e.value) return true;
            const grid = gridRef.current?.instance();
            if (!grid) return true;
            
            const items = grid.getDataSource().items();
            const changes = grid.option("editing.changes") || [];
            let duplicateCount = 0;
            
            for (let item of items) {
               const isBeingEdited = changes.some(c => c.key === item.Code || c.key === item._rowId);
               if (!isBeingEdited && item.Code === e.value) duplicateCount++;
            }
            for (let change of changes) {
               if (change.type === "insert" || change.type === "update") {
                   const original = items.find(i => i.Code === change.key || i._rowId === change.key) || {};
                   const codeToCheck = change.data.Code !== undefined ? change.data.Code : original.Code;
                   if (codeToCheck === e.value) duplicateCount++;
               }
            }
            return duplicateCount <= 1;
          }
        }
      ]
    },
    { 
      dataField: "Name",  
      caption: translate("Class Name *"), 
      minWidth: 300, 
      dataType: "string",
      validationRules: [
        { type: "required", message: translate("Vui lòng nhập Tên Class!") },
        {
          type: "custom",
          message: translate("Tên Class đã tồn tại!"),
          validationCallback: (e) => {
            if (!e.value) return true;
            const grid = gridRef.current?.instance();
            if (!grid) return true;
            
            const items = grid.getDataSource().items();
            const changes = grid.option("editing.changes") || [];
            let duplicateCount = 0;
            
            for (let item of items) {
               const isBeingEdited = changes.some(c => c.key === item.Code || c.key === item._rowId);
               if (!isBeingEdited && item.Name === e.value) duplicateCount++;
            }
            for (let change of changes) {
               if (change.type === "insert" || change.type === "update") {
                   const original = items.find(i => i.Code === change.key || i._rowId === change.key) || {};
                   const nameToCheck = change.data.Name !== undefined ? change.data.Name : original.Name;
                   if (nameToCheck === e.value) duplicateCount++;
               }
            }
            return duplicateCount <= 1;
          }
        }
      ]
    },
    { dataField: "UseYN", caption: translate("Active"),     
      width: 150,    
      dataType: "boolean", 
      alignment: "center",
      allowEditing: true, isSelected: false 
    },
    {
      dataField: "_action",
      caption: translate("Actions"),
      width: 100,
      allowFiltering: true,
      allowEditing: false, // Ngăn DevExtreme tự động đưa ô này vào chế độ nhập liệu
      alignment: "center",
      type: "buttons",
      buttons: [
        "edit",
        {
          hint: translate("Save"),
          icon: "save",
          visible: (e) => {
            return e.row?.isEditing === true &&  e.row?.isNewRow !== true;
          },
        onClick: (e) => {
          gridRef.current?.instance().saveEditData();
        }
        },
        {
          hint: translate("Cancel/Remove"),
          icon: "revert",
          visible: (e) => {
            return e.row?.isNewRow === true || e.row?.isEditing === true   
          },
          onClick: (e) => {
            if (e.row?.isNewRow === true) {
              gridRef.current?.instance().deleteRow(e.row.rowIndex);
            } else if (e.row?.isEditing === true) {
              gridRef.current?.instance().cancelEditData();
            }
          }
        }
      ]
    }
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
        onClick={handleAddRow}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>

      {/* Save */}
      <button
        className="item-action-btn"
        title={translate("Save")}
        onClick={handleSave}
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
          e.data._rowId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
          e.data.Code = "";
          e.data.Name = "";
          e.data.UseYN = true;
        }}
        onSaving={handleSaving}
        onEditorPrepared={(e) => { if (e?.row?.rowType === 'data') setIsEditing(true); }}
        onSaved={() => setIsEditing(false)}
      >
        
        <Selection mode="multiple" showCheckBoxesMode="always" />
        <Editing
          mode="batch"
          useIcons={true}
          allowAdding={false}
          allowUpdating={true}
          allowDeleting={false}
          newRowPosition="first"
          startEditAction="click"
        />
      </DxDataGrid>
    </ItemPageLayout>
  );
}
