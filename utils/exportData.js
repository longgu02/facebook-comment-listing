import xlsx from 'xlsx';
import path from 'path';

const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) =>{
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ... data
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
}

const exportCommentToExcel = (comments, workSheetColumnNames, workSheetName, filePath) => {
    const data = comments.map((comment) => {
        return [comment.from.name, comment.from.id, new Date(comment.created_time).toString(),comment.doneTime, comment.message]
    });
    exportExcel(data, workSheetColumnNames, workSheetName, filePath);
}

const exportAllCommentToExcel = (comments, workSheetColumnNames, workSheetName, filePath) => {
    const data = comments.map((comment) => {
        return [comment.from.name, comment.from.id, new Date(comment.created_time).toString(), comment.message]
    });
    exportExcel(data, workSheetColumnNames, workSheetName, filePath);
}

export {exportCommentToExcel, exportAllCommentToExcel};