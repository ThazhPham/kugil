import { useState, useMemo } from 'react';
import CustomStore from 'devextreme/data/custom_store';

// Helper function to parse DevExtreme filter arrays to our API payload
export const parseDxFilter = (filterArr) => {
    if (!filterArr || !filterArr.length) return [];
    const results = [];
    if (typeof filterArr[0] === 'string' && filterArr.length === 3) {
        let op = filterArr[1];
        if (typeof op === 'string') {
            const lowerOp = op.toLowerCase();
            if (lowerOp === 'contains') op = 'Contains';
            else if (lowerOp === '=') op = 'IsEqualTo';
            else if (lowerOp === '<>') op = 'IsNotEqualTo';
            else if (lowerOp === 'startswith') op = 'StartsWith';
            else if (lowerOp === 'endswith') op = 'EndsWith';
        }

        // Người dùng muốn gõ tìm kiếm "Contains" trên các cột dropdown
        if (op === 'IsEqualTo' && (filterArr[0] === 'ItemsGroupCode' || filterArr[0].startsWith('ItemClass'))) {
            op = 'Contains';
        }

        let val = filterArr[2];
        if (val && typeof val === 'object' && val.value !== undefined) {
            val = val.value;
        }

        results.push({ 
            ColumName: filterArr[0], 
            TypeFilter: op, 
            ValueDefault: val != null ? String(val) : "",
            DataValue: "TEXT"
        });
        return results;
    }
    filterArr.forEach(item => {
        if (Array.isArray(item)) {
            results.push(...parseDxFilter(item));
        }
    });
    return results;
};

export const useDxGridRemote = ({
    fetchData,
    data,
    keyExpr = "Code",
    defaultPageSize = 20,
    externalFilters = []
}) => {
    // Internal Pagination States
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(defaultPageSize);
    const [totalRows, setTotalRows] = useState(0);

    const dataSource = useMemo(() => {
        if (!fetchData) return data;
        
        return new CustomStore({
            key: keyExpr,
            load: async (loadOptions) => {
                try {
                    const take = loadOptions.take || perPage;
                    const currentPage = loadOptions.skip ? Math.floor(loadOptions.skip / take) + 1 : 1;

                    let filtering = [];
                    if (loadOptions.filter) {
                        filtering = parseDxFilter(loadOptions.filter);
                    } else if (loadOptions.searchValue) {
                        filtering.push({ 
                            ColumName: "All", 
                            TypeFilter: "Contains", 
                            ValueDefault: loadOptions.searchValue,
                            DataValue: "TEXT"
                        });
                    }

                    // Merge with external filters
                    if (externalFilters && externalFilters.length > 0) {
                        filtering = [...filtering, ...externalFilters];
                    }

                    let sortings = [{ ColumName: "CreateDate", TypeSorting: "DESC" }];
                    // Tạm thời bỏ qua sort của DataGrid vì backend có thể không hỗ trợ sort động trên mọi cột,
                    // gây ra lỗi trả về full null.
                    // if (loadOptions.sort && loadOptions.sort.length > 0) {
                    //     sortings = loadOptions.sort.map(s => ({
                    //         ColumName: s.selector,
                    //         TypeSorting: s.desc ? "DESC" : "ASC"
                    //     }));
                    // }

                    const payload = {
                        page: currentPage,
                        perPage: take,
                        filtering,
                        sortings
                    };
                    console.log("[DxDataGrid] Sending API Payload:", JSON.stringify(payload, null, 2));

                    const result = await fetchData(payload);

                    // Điều kiện: nếu request trả về null hoặc rỗng thì báo no data
                    if (result === null || result === "" || !result?.Data || !result?.Data?.List || result.Data.List.length === 0) {
                        setTotalRows(0);
                        return { data: [], totalCount: 0 };
                    }

                    const items = result.Data.List;
                    const total = result.Data.TotalRows ?? items[0]?.totalRows ?? items.length;

                    // Update UI state for total rows only!
                    // Do NOT call setPage here because it causes DevExtreme React infinite loops!
                    setTotalRows(total);

                    return {
                        data: items,
                        totalCount: total
                    };
                } catch (err) {
                    console.error("[DxDataGrid] API Error:", err);
                    return { data: [], totalCount: 0 };
                }
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, data, keyExpr, perPage, JSON.stringify(externalFilters)]);

    // Helper functions for custom pagination component
    const totalPages = perPage === 99999 ? 1 : Math.ceil(totalRows / perPage);
    
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3, 4, 5);
            if (page > 5) { pages.push("..."); pages.push(page); }
            if (totalPages > 6) { pages.push("..."); pages.push(totalPages); }
        }
        return [...new Set(pages)];
    };

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const changePerPage = (newSize) => {
        setPerPage(newSize);
        setPage(1);
    };

    const handleOptionChanged = (e) => {
        // Sync DevExtreme internal state with React state
        if (e.fullName === 'paging.pageIndex') {
            setPage(e.value + 1);
        }
        if (e.fullName === 'paging.pageSize') {
            setPerPage(e.value);
        }
    };

    return {
        dataSource,
        page,
        perPage,
        totalRows,
        totalPages,
        getPageNumbers,
        changePage,
        changePerPage,
        handleOptionChanged
    };
};
