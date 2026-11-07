
/* =========================================
   和い寿 勤怠管理アプリ
   独自時刻選択 + 勤怠計算 完成版
========================================= */


/* =========================================
   ① HTML要素の取得
========================================= */

// 時刻の保存先
const startTimeInput =
    document.getElementById("startTime");

const endTimeInput =
    document.getElementById("endTime");

// 時刻選択ボタン
const startTimeButton =
    document.getElementById("startTimeButton");

const endTimeButton =
    document.getElementById("endTimeButton");

// 休憩入力
const break1Input =
    document.getElementById("break1");

const break2Input =
    document.getElementById("break2");

// 計算関連
const calculateButton =
    document.getElementById("calculateButton");

const resultSection =
    document.getElementById("resultSection");

// 計算結果
const startResultLabel =
    document.getElementById("startResultLabel");

const startResult =
    document.getElementById("startResult");

const endResultLabel =
    document.getElementById("endResultLabel");

const endResult =
    document.getElementById("endResult");

const workLabel =
    document.getElementById("workLabel");

const workResult =
    document.getElementById("workResult");

const overtimeLabel =
    document.getElementById("overtimeLabel");

const overtimeResult =
    document.getElementById("overtimeResult");

const separatePaperValue =
    document.getElementById("separatePaperValue");

// 別紙ルール
const separatePaperToggle =
    document.getElementById("separatePaperToggle");

// 時刻選択モーダル
const timePickerModal =
    document.getElementById("timePickerModal");

const pickerHour =
    document.getElementById("pickerHour");

const pickerMinute =
    document.getElementById("pickerMinute");

const pickerPreview =
    document.getElementById("pickerPreview");

const pickerCancel =
    document.getElementById("pickerCancel");

const pickerConfirm =
    document.getElementById("pickerConfirm");


/* =========================================
   ② 時刻選択欄の準備
========================================= */

let activeTimeInput = null;
let activeTimeButton = null;


/* 時の選択肢を作成 */

for (let hour = 0; hour <= 23; hour++) {

    const option = document.createElement("option");

    option.value =
        String(hour).padStart(2, "0");

    option.textContent =
        String(hour).padStart(2, "0");

    pickerHour.appendChild(option);

}


/* 分の選択肢を作成 */

for (let minute = 0; minute <= 59; minute++) {

    const option = document.createElement("option");

    option.value =
        String(minute).padStart(2, "0");

    option.textContent =
        String(minute).padStart(2, "0");

    pickerMinute.appendChild(option);

}


/* 選択中の時刻を表示 */

function updatePickerPreview() {

    pickerPreview.textContent =
        `${pickerHour.value}:${pickerMinute.value}`;

}


/* =========================================
   ③ 時刻選択画面を開く
========================================= */

function openTimePicker(inputElement, buttonElement) {

    activeTimeInput = inputElement;
    activeTimeButton = buttonElement;

    const currentValue =
        inputElement.value;

    if (currentValue && currentValue.includes(":")) {

        const parts = currentValue.split(":");

        pickerHour.value = parts[0];
        pickerMinute.value = parts[1];

    } else {

        // 未選択の場合の初期値
        pickerHour.value = "09";
        pickerMinute.value = "00";

    }

    updatePickerPreview();

    timePickerModal.classList.remove("hidden");

    timePickerModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* 出勤時間ボタン */

startTimeButton.addEventListener("click", () => {

    openTimePicker(
        startTimeInput,
        startTimeButton
    );

});


/* 退勤時間ボタン */

endTimeButton.addEventListener("click", () => {

    openTimePicker(
        endTimeInput,
        endTimeButton
    );

});


/* =========================================
   ④ 時刻選択画面の操作
========================================= */

pickerHour.addEventListener(
    "change",
    updatePickerPreview
);

pickerMinute.addEventListener(
    "change",
    updatePickerPreview
);


/* =========================================
   ⑤ 時刻選択を閉じる
========================================= */

function closeTimePicker() {

    timePickerModal.classList.add("hidden");

    timePickerModal.setAttribute(
        "aria-hidden",
        "true"
    );

    activeTimeInput = null;
    activeTimeButton = null;

}


/* キャンセル */

pickerCancel.addEventListener(
    "click",
    closeTimePicker
);


/* 背景部分をタップして閉じる */

timePickerModal.addEventListener("click", (event) => {

    if (event.target === timePickerModal) {

        closeTimePicker();

    }

});


/* Escapeキーで閉じる */

document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        !timePickerModal.classList.contains("hidden")
    ) {

        closeTimePicker();

    }

});


/* =========================================
   ⑥ 時刻を確定する
========================================= */

pickerConfirm.addEventListener("click", () => {

    if (!activeTimeInput || !activeTimeButton) {
        return;
    }

    const selectedTime =
        `${pickerHour.value}:${pickerMinute.value}`;

    // 計算用の値を保存
    activeTimeInput.value = selectedTime;

    // 画面に表示
    activeTimeButton.textContent = selectedTime;

    activeTimeButton.classList.add("has-value");

    // 古い計算結果を消す
    clearResult();

    closeTimePicker();

});


/* =========================================
   ⑦ 別紙ルール設定
   自動 → ON → OFF → 自動
========================================= */

let separatePaperMode = "auto";


separatePaperToggle.addEventListener("click", () => {

    if (separatePaperMode === "auto") {

        separatePaperMode = "on";

        separatePaperToggle.textContent = "ON";

    } else if (separatePaperMode === "on") {

        separatePaperMode = "off";

        separatePaperToggle.textContent = "OFF";

    } else {

        separatePaperMode = "auto";

        separatePaperToggle.textContent = "自動";

    }

    clearResult();

});


/* =========================================
   ⑧ 時刻を分に変換
========================================= */

function timeToMinutes(value) {

    if (!value) {
        return null;
    }

    const parts = value.split(":");

    if (parts.length !== 2) {
        return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;

}


/* =========================================
   ⑨ 休憩時間を分に変換
========================================= */

function durationToMinutes(value) {

    if (!value || value.trim() === "") {
        return null;
    }

    const normalized =
        value.trim().replace(/：/g, ":");

    const parts = normalized.split(":");

    if (parts.length !== 2) {
        return null;
    }

    const hoursText = parts[0].trim();
    const minutesText = parts[1].trim();

    if (
        !/^\d+$/.test(hoursText) ||
        !/^\d+$/.test(minutesText)
    ) {
        return null;
    }

    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        minutes < 0 ||
        minutes >= 60
    ) {
        return null;
    }

    return hours * 60 + minutes;

}


/* =========================================
   ⑩ 分を「○：△」形式に変換
========================================= */

function minutesToDisplay(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    return (
        `${hours}：${String(minutes).padStart(2, "0")}`
    );

}


/* =========================================
   ⑪ 分を「HH:MM」形式に変換
========================================= */

function minutesToTimeDisplay(totalMinutes) {

    const normalized =
        ((totalMinutes % 1440) + 1440) % 1440;

    const hours =
        Math.floor(normalized / 60);

    const minutes =
        normalized % 60;

    return (
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}`
    );

}


/* =========================================
   ⑫ 別紙記入欄の表示更新
========================================= */

function updateSeparatePaperDisplay(useSeparatePaper) {

    separatePaperValue.textContent =
        useSeparatePaper ? "2：00" : "なし";

}


/* =========================================
   ⑬ 計算結果をリセット
========================================= */

function clearResult() {

    resultSection.classList.add("hidden");

    startResultLabel.textContent = "出勤時間";
    endResultLabel.textContent = "退勤時間";

    workLabel.textContent = "実働時間";
    overtimeLabel.textContent = "残業時間";

    startResult.textContent = "--:--";
    endResult.textContent = "--:--";

    workResult.textContent = "0：00";
    overtimeResult.textContent = "0：00";

    updateSeparatePaperDisplay(false);

}


/* =========================================
   ⑭ 入力変更時に古い結果を消す
========================================= */

[
    break1Input,
    break2Input

].forEach((input) => {

    input.addEventListener("input", clearResult);

});


/* =========================================
   ⑮ 計算ボタン
========================================= */

calculateButton.addEventListener(
    "click",
    calculateAttendance
);


/* =========================================
   ⑯ 勤怠計算メイン処理
========================================= */

function calculateAttendance() {

    clearResult();


    /* 出勤時間チェック */

    if (!startTimeInput.value) {

        alert("出勤時間を入力してください。");

        startTimeButton.focus();

        return;
    }


    /* 退勤時間チェック */

    if (!endTimeInput.value) {

        alert("退勤時間を入力してください。");

        endTimeButton.focus();

        return;
    }


    /* 時刻を分に変換 */

    const startMinutes =
        timeToMinutes(startTimeInput.value);

    let endMinutes =
        timeToMinutes(endTimeInput.value);


    if (
        startMinutes === null ||
        endMinutes === null
    ) {

        alert(
            "出勤時間または退勤時間が正しくありません。"
        );

        return;
    }


    /* =====================================
       日をまたぐ勤務に対応

       例：
       出勤 22:00
       退勤 12:00

       退勤を翌日の12:00として扱う
    ===================================== */

    if (endMinutes < startMinutes) {

        endMinutes += 24 * 60;

    }


    /* 出勤と退勤が同じ場合 */

    if (endMinutes === startMinutes) {

        alert(
            "出勤時間と退勤時間が同じです。\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* 勤務時間の合計 */

    const totalSpan =
        endMinutes - startMinutes;


    if (totalSpan <= 0) {

        alert(
            "勤務時間を正しく計算できません。\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* 休憩①チェック */

    if (!break1Input.value.trim()) {

        alert("休憩①を入力してください。");

        break1Input.focus();

        return;
    }


    const break1 =
        durationToMinutes(break1Input.value);


    if (break1 === null) {

        alert(
            "休憩①の入力が正しくありません。\n\n" +
            "「時間：分」の形式で入力してください。\n" +
            "例：0：54"
        );

        break1Input.focus();

        return;
    }


    /* 休憩②チェック */

    let break2 = 0;


    if (break2Input.value.trim() !== "") {

        break2 =
            durationToMinutes(break2Input.value);

        if (break2 === null) {

            alert(
                "休憩②の入力が正しくありません。\n\n" +
                "「時間：分」の形式で入力してください。\n" +
                "例：0：30"
            );

            break2Input.focus();

            return;
        }

    }


    /* 休憩合計 */

    const totalBreak =
        break1 + break2;


    if (totalBreak > totalSpan) {

        alert(
            "休憩時間の合計が勤務時間を超えています。\n\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* 実働時間 */

    const actualWork =
        totalSpan - totalBreak;


    if (actualWork <= 0) {

        alert(
            "実働時間が0以下になっています。"
        );

        return;
    }


    /* 残業時間：実働8時間を超えた部分 */

    const overtime =
        Math.max(0, actualWork - 480);


    /* =====================================
       ⑰ 2時間別紙ルール判定

       自動：残業2時間以上で適用
       ON：残業2時間以上で適用
       OFF：適用しない
    ===================================== */

    let useSeparatePaper = false;


    if (separatePaperMode === "auto") {

        useSeparatePaper = overtime >= 120;

    } else if (separatePaperMode === "on") {

        useSeparatePaper = overtime >= 120;

    } else if (separatePaperMode === "off") {

        useSeparatePaper = false;

    }


    /* =====================================
       ⑱ 表示用時間を計算
    ===================================== */

    let displayWork =
        actualWork;

    let displayOvertime =
        overtime;

    let displayEndMinutes =
        endMinutes;


    if (useSeparatePaper) {

        displayWork =
            actualWork - 120;

        displayOvertime =
            overtime - 120;

        displayEndMinutes =
            endMinutes - 120;

    }


    /* =====================================
       ⑲ 結果ラベルを切り替え
    ===================================== */

    if (useSeparatePaper) {

        endResultLabel.textContent =
            "（勤務表上の）退勤時間";

        workLabel.textContent =
            "（勤務表上の）実働時間";

        overtimeLabel.textContent =
            "（勤務表上の）残業時間";

    } else {

        endResultLabel.textContent =
            "退勤時間";

        workLabel.textContent =
            "実働時間";

        overtimeLabel.textContent =
            "残業時間";

    }


    /* 別紙記入欄 */

    updateSeparatePaperDisplay(
        useSeparatePaper
    );


    /* =====================================
       ⑳ 計算結果を画面に反映
    ===================================== */

    startResult.textContent =
        minutesToTimeDisplay(startMinutes);

    endResult.textContent =
        minutesToTimeDisplay(displayEndMinutes);

    workResult.textContent =
        minutesToDisplay(displayWork);

    overtimeResult.textContent =
        minutesToDisplay(displayOvertime);


    /* 結果表示 */

    resultSection.classList.remove("hidden");


    /* 結果までスクロール */

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
