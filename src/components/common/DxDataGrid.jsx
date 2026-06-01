import { useRef, forwardRef } from 'react';
import DataGrid, { 
    Scrolling, 
    SearchPanel, 
    Paging, 
    Pager, 
    Column,
    FilterRow,
    ColumnFixing
} from 'devextreme-react/data-grid';
import { useAutoI18n } from '../../i18n/useAutoI18n';
import { useDxGridRemote } from '../../hooks/useDxGridRemote';

const PAGE_SIZES = [20, 50, 100, 200, 500, 99999]; // 99999 represents "All"

/**
 * Reusable DevExtreme DataGrid Component with Remote API Pagination Support
 */
const DxDataGrid = forwardRef(({
    data = [],
    columns = [],
    loading = false,
    defaultPageSize = 20,
    height = "100%",

    // API
    fetchData,
    keyExpr = "Code",
    externalFilters = [],

    // Options UI
    showBorders = true,
    columnAutoWidth = true,
    rowAlternationEnabled = true,
    hoverStateEnabled = true,

    children,
    ...restProps
}, ref) => {
    const { translate } = useAutoI18n();
    const internalRef = useRef(null);
    const gridRef = ref || internalRef;
    const isRemote = !!fetchData;
    const { onToolbarPreparing, ...otherProps } = restProps;

    const handleToolbarPreparing = (e) => {
        if (e.toolbarOptions?.items) {
            e.toolbarOptions.items = e.toolbarOptions.items.filter(
                (item) => item.name !== 'saveButton' && item.name !== 'revertButton'
            );
        }
        if (onToolbarPreparing) {
            onToolbarPreparing(e);
        }
    };

    // Sử dụng custom hook để quản lý toàn bộ logic remote và phân trang
    const {
        dataSource,
        page,
        perPage,
        totalRows,
        totalPages,
        getPageNumbers,
        changePage,
        changePerPage,
        handleOptionChanged
    } = useDxGridRemote({
        fetchData,
        data,
        keyExpr,
        defaultPageSize,
        externalFilters
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <DataGrid
                    ref={gridRef}
                    height={height}
                    dataSource={dataSource}
                    keyExpr={!fetchData ? keyExpr : undefined} // CustomStore holds the key
                    showBorders={showBorders}
                    columnAutoWidth={columnAutoWidth}
                    rowAlternationEnabled={rowAlternationEnabled}
                    hoverStateEnabled={hoverStateEnabled}
                    remoteOperations={isRemote}
                    noDataText={loading ? "Loading..." : "No data"}
                    onOptionChanged={handleOptionChanged}
                    onToolbarPreparing={handleToolbarPreparing}
                    {...otherProps}
                >
                    <FilterRow visible={true} applyFilter="auto" showOperationChooser={false} />
                    <Scrolling mode="standard" showScrollbar="always" />
                    <SearchPanel visible={false} />
                    <Paging pageSize={perPage} pageIndex={page - 1} />
                    <Pager visible={false} /> {/* Ẩn Pager mặc định */}
                    <ColumnFixing enabled={true} />

                    {/* Map qua mảng columns truyền vào để render linh hoạt */}
                    {columns.map((col, index) => (
                        <Column
                            key={index}
                            dataField={col.dataField}
                            caption={col.caption}
                            {...col} 
                        />
                    ))}
                    {children}
                </DataGrid>
            </div>

            {/* Custom Pagination Footer */}
            <div className="data-grid-pagination">
                <div className="data-grid-pagination__sizes">
                    {PAGE_SIZES.map((size) => (
                        <button
                            key={size}
                            className={`data-grid-pagination__size ${perPage === size ? "active" : ""}`}
                            onClick={() => changePerPage(size)}
                        >
                            {size === 99999 ? translate("All") : size}
                        </button>
                    ))}
                </div>

                <div className="data-grid-pagination__info">
                    {translate("page")} #{page}, {translate("total")}: {totalPages} ({totalRows.toLocaleString()} {translate("items")})
                </div>

                <div className="data-grid-pagination__pages">
                    <button
                        className="data-grid-pagination__nav"
                        disabled={page <= 1}
                        onClick={() => changePage(Math.max(1, page - 1))}
                    >‹</button>

                    {getPageNumbers().map((p, i) =>
                        p === "..." ? (
                            <span key={`dots-${i}`} className="data-grid-pagination__dots">…</span>
                        ) : (
                            <button
                                key={p}
                                className={`data-grid-pagination__page ${page === p ? "active" : ""}`}
                                onClick={() => changePage(p)}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        className="data-grid-pagination__nav"
                        disabled={page >= totalPages}
                        onClick={() => changePage(Math.min(totalPages, page + 1))}
                    >›</button>
                </div>
            </div>
        </div>
    );
});

export default DxDataGrid;
