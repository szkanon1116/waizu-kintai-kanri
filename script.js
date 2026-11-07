
/* =========================================
   和い寿 勤怠管理アプリ
   JavaScript 完成版
========================================= */


/* =========================================
   ① HTML要素の取得
========================================= */

const startTimeInput =
    document.getElementById("startTime");

const endTimeInput =
    document.getElementById("endTime");

const break1Input =
    document.getElementById("break1");

const break2Input =
    document.getElementById("break2");

const calculateButton =
    document.getElementById("calculateButton");

const resultSection =
    document.getElementById("resultSection");

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

const separatePaperToggle =
    document.getElementById("separatePaperToggle");


/*
  別紙欄の文字は、計算時に直接取得する。
  HTML側のIDに依存して文字を更新する。
*/
function updateSeparatePaperDisplay(useSeparatePaper) {

    const paperValueElement =
        document.querySelector(
            "#separatePaperResult .result-value"
        );

    if (!paperValueElement) {
        console.error("別紙記入欄が見つかりません。");
        return;
    }

    paperValueElement.textContent =
        useSeparatePaper ? "2：00" : "なし";
}


/* =========================================
   ② 別紙ルール設定
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
   ③ 時刻を分に変換
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
   ④ 休憩時間を分に変換
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
   ⑤ 分を「○：△」形式に変換
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
   ⑥ 分を「HH:MM」形式に変換
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
   ⑦ 計算結果をリセット
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
   ⑧ 入力変更時に古い結果を消す
========================================= */

[
    startTimeInput,
    endTimeInput,
    break1Input,
    break2Input

].forEach((input) => {

    input.addEventListener("input", clearResult);

});


/* =========================================
   ⑨ 計算ボタン
========================================= */

calculateButton.addEventListener(
    "click",
    calculateAttendance
);


/* =========================================
   ⑩ 勤怠計算メイン処理
========================================= */

function calculateAttendance() {

    clearResult();


    /* -------------------------------------
       出勤時間チェック
    ------------------------------------- */

    if (!startTimeInput.value) {

        alert("出勤時間を入力してください。");

        startTimeInput.focus();

        return;
    }


    /* -------------------------------------
       退勤時間チェック
    ------------------------------------- */

    if (!endTimeInput.value) {

        alert("退勤時間を入力してください。");

        endTimeInput.focus();

        return;
    }


    /* -------------------------------------
       時刻を分に変換
    ------------------------------------- */

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


    /* -------------------------------------
       日をまたぐ勤務に対応

       例：
       出勤 22:00
       退勤 12:00

       退勤を翌日の12:00として扱う
    ------------------------------------- */

    if (endMinutes < startMinutes) {

        endMinutes += 24 * 60;

    }


    /* -------------------------------------
       出勤と退勤が同じ場合
    ------------------------------------- */

    if (endMinutes === startMinutes) {

        alert(
            "出勤時間と退勤時間が同じです。\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* -------------------------------------
       勤務時間の合計
    ------------------------------------- */

    const totalSpan =
        endMinutes - startMinutes;


    if (totalSpan <= 0) {

        alert(
            "勤務時間を正しく計算できません。\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* -------------------------------------
       休憩①チェック
    ------------------------------------- */

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


    /* -------------------------------------
       休憩②チェック
       空欄の場合は0分
    ------------------------------------- */

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


    /* -------------------------------------
       休憩時間の合計
    ------------------------------------- */

    const totalBreak =
        break1 + break2;


    if (totalBreak > totalSpan) {

        alert(
            "休憩時間の合計が勤務時間を超えています。\n\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* -------------------------------------
       実働時間
    ------------------------------------- */

    const actualWork =
        totalSpan - totalBreak;


    if (actualWork <= 0) {

        alert(
            "実働時間が0以下になっています。"
        );

        return;
    }


    /* -------------------------------------
       残業時間
       実働8時間を超えた部分
    ------------------------------------- */

    const overtime =
        Math.max(0, actualWork - 480);


    /* =====================================
       ⑪ 2時間別紙ルール判定

       自動：
       残業2時間以上で適用

       ON：
       残業2時間以上で適用

       OFF：
       適用しない
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
       ⑫ 表示用時間を計算
    ===================================== */

    let displayWork =
        actualWork;

    let displayOvertime =
        overtime;

    let displayEndMinutes =
        endMinutes;


    if (useSeparatePaper) {

        /*
          勤務表上の実働時間から2時間引く
        */

        displayWork =
            actualWork - 120;


        /*
          勤務表上の残業時間から2時間引く
        */

        displayOvertime =
            overtime - 120;


        /*
          勤務表上の退勤時間から2時間引く
        */

        displayEndMinutes =
            endMinutes - 120;

    }


    /* =====================================
       ⑬ 結果ラベルの切り替え
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


    /* =====================================
       ⑭ 別紙記入欄の表示

       適用あり → 2：00
       適用なし → なし

       昼勤・夜勤共通
    ===================================== */

    updateSeparatePaperDisplay(
        useSeparatePaper
    );


    /* =====================================
       ⑮ 計算結果を画面に反映
    ===================================== */

    startResult.textContent =
        minutesToTimeDisplay(startMinutes);

    endResult.textContent =
        minutesToTimeDisplay(displayEndMinutes);

    workResult.textContent =
        minutesToDisplay(displayWork);

    overtimeResult.textContent =
        minutesToDisplay(displayOvertime);


    /* =====================================
       ⑯ 結果表示
    ===================================== */

    resultSection.classList.remove("hidden");


    /* 結果までスクロール */

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
