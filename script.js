/* =========================================
   和い寿 勤怠管理アプリ
   ヒューマンエラー対策版
========================================= */


/* =========================================
   要素取得
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


/* 結果 */

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

const separatePaperResult =
    document.getElementById("separatePaperResult");


const separatePaperToggle =
    document.getElementById("separatePaperToggle");


/* =========================================
   2時間別紙ルール

   AUTO → ON → OFF → AUTO
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


    /*
     * 別紙ルールを変更したら、
     * 以前の計算結果を消す。
     */

    clearResult();

});


/* =========================================
   時刻を「分」に変換
========================================= */

function timeToMinutes(timeValue) {

    if (!timeValue) {
        return null;
    }


    const parts =
        timeValue.split(":");


    if (parts.length !== 2) {
        return null;
    }


    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);


    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes)
    ) {
        return null;
    }


    if (
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
   所要時間を「分」に変換

   例：
   1：30 → 90分
   0：54 → 54分

   「：」と「:」の両方に対応
========================================= */

function durationToMinutes(value) {

    if (!value || value.trim() === "") {
        return null;
    }


    const normalized =
        value
            .trim()
            .replace(/：/g, ":");


    const parts =
        normalized.split(":");


    if (parts.length !== 2) {
        return null;
    }


    const hoursText =
        parts[0].trim();

    const minutesText =
        parts[1].trim();


    /*
     * 数字以外を拒否
     */

    if (
        !/^\d+$/.test(hoursText) ||
        !/^\d+$/.test(minutesText)
    ) {
        return null;
    }


    const hours =
        Number(hoursText);

    const minutes =
        Number(minutesText);


    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes)
    ) {
        return null;
    }


    if (
        hours < 0 ||
        minutes < 0 ||
        minutes >= 60
    ) {
        return null;
    }


    return hours * 60 + minutes;
}


/* =========================================
   分を「○：△」形式に変換
========================================= */

function minutesToDisplay(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;


    return `${hours}：${String(minutes).padStart(2, "0")}`;
}


/* =========================================
   分を「HH:MM」形式に変換

   出勤・退勤時間表示用
========================================= */

function minutesToTimeDisplay(totalMinutes) {

    const normalizedMinutes =
        (
            totalMinutes % (24 * 60) +
            (24 * 60)
        ) % (24 * 60);


    const hours =
        Math.floor(normalizedMinutes / 60);

    const minutes =
        normalizedMinutes % 60;


    return (
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}`
    );
}


/* =========================================
   結果を消す
========================================= */

function clearResult() {

    resultSection.classList.add("hidden");


    startResultLabel.textContent =
        "出勤時間";

    endResultLabel.textContent =
        "退勤時間";

    workLabel.textContent =
        "実働時間";

    overtimeLabel.textContent =
        "残業時間";


    startResult.textContent =
        "--:--";

    endResult.textContent =
        "--:--";

    workResult.textContent =
        "0：00";

    overtimeResult.textContent =
        "0：00";


    separatePaperResult.classList.add(
        "hidden"
    );
}


/* =========================================
   入力内容が変更されたら
   古い計算結果を消す
========================================= */

const inputElements = [
    startTimeInput,
    endTimeInput,
    break1Input,
    break2Input
];


inputElements.forEach((input) => {

    input.addEventListener("input", () => {

        clearResult();

    });

});


/* =========================================
   計算ボタン
========================================= */

calculateButton.addEventListener(
    "click",
    calculateAttendance
);


/* =========================================
   勤怠計算
========================================= */

function calculateAttendance() {


    /* =====================================
       ① 出勤・退勤の入力チェック
    ===================================== */

    if (!startTimeInput.value) {

        alert(
            "出勤時間を入力してください。"
        );

        startTimeInput.focus();

        return;
    }


    if (!endTimeInput.value) {

        alert(
            "退勤時間を入力してください。"
        );

        endTimeInput.focus();

        return;
    }


    /* =====================================
       ② 出勤・退勤を分に変換
    ===================================== */

    const startMinutes =
        timeToMinutes(
            startTimeInput.value
        );


    let endMinutes =
        timeToMinutes(
            endTimeInput.value
        );


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
       ③ 夜勤対応

       退勤 < 出勤
       → 翌日の退勤として扱う
    ===================================== */

    if (endMinutes < startMinutes) {

        endMinutes += 24 * 60;
    }


    /* =====================================
       ④ 出勤＝退勤をチェック
    ===================================== */

    if (endMinutes === startMinutes) {

        alert(
            "出勤時間と退勤時間が同じです。\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* =====================================
       ⑤ 勤務時間
    ===================================== */

    const totalSpan =
        endMinutes - startMinutes;


    if (totalSpan <= 0) {

        alert(
            "勤務時間を正しく計算できません。\n" +
            "出勤・退勤時間を確認してください。"
        );

        return;
    }


    /* =====================================
       ⑥ 休憩①チェック

       休憩①は必須
    ===================================== */

    if (!break1Input.value.trim()) {

        alert(
            "休憩①を入力してください。"
        );

        break1Input.focus();

        return;
    }


    const break1 =
        durationToMinutes(
            break1Input.value
        );


    if (break1 === null) {

        alert(
            "休憩①の入力が正しくありません。\n\n" +
            "「時間：分」の形式で入力してください。\n" +
            "例：0：54"
        );

        break1Input.focus();

        return;
    }


    /* =====================================
       ⑦ 休憩②チェック

       空欄OK
    ===================================== */

    let break2 = 0;


    if (
        break2Input.value.trim() !== ""
    ) {

        break2 =
            durationToMinutes(
                break2Input.value
            );


        if (break2 === null) {

            alert(
                "休憩②の入力が正しくありません。\n\n" +
                "「時間：分」の形式で入力してください。\n" +
                "例：0：30\n\n" +
                "休憩②がない場合は空欄にしてください。"
            );

            break2Input.focus();

            return;
        }
    }


    /* =====================================
       ⑧ 休憩合計
    ===================================== */

    const totalBreak =
        break1 + break2;


    /* =====================================
       ⑨ 休憩が勤務時間を超えていないか
    ===================================== */

    if (totalBreak > totalSpan) {

        alert(
            "休憩時間の合計が勤務時間を超えています。\n\n" +
            "出勤・退勤・休憩時間を確認してください。"
        );

        return;
    }


    /* =====================================
       ⑩ 実働時間
    ===================================== */

    const actualWork =
        totalSpan - totalBreak;


    if (actualWork <= 0) {

        alert(
            "実働時間が0以下になっています。\n\n" +
            "入力内容を確認してください。"
        );

        return;
    }


    /* =====================================
       ⑪ 残業時間

       8時間を超えた部分
    ===================================== */

    const overtime =
        Math.max(
            0,
            actualWork - 8 * 60
        );


    /* =====================================
       ⑫ 別紙ルール判定
    ===================================== */

    let useSeparatePaper = false;


    /*
     * 自動
     *
     * 残業が1：59を超える
     * → 2時間別紙
     */

    if (
        separatePaperMode === "auto"
    ) {

        useSeparatePaper =
            overtime > 119;
    }


    /*
     * 手動ON
     */

    else if (
        separatePaperMode === "on"
    ) {

        useSeparatePaper = true;
    }


    /*
     * 手動OFF
     */

    else if (
        separatePaperMode === "off"
    ) {

        useSeparatePaper = false;
    }


    /* =====================================
       ⑬ 表示用の時間
    ===================================== */

    let displayWork =
        actualWork;

    let displayOvertime =
        overtime;

    let displayEndMinutes =
        endMinutes;


    /* =====================================
       ⑭ 別紙ルール適用時
    ===================================== */

    if (useSeparatePaper) {

        /*
         * 残業2時間未満なのに
         * 別紙ルールを適用する事故を防止
         */

        if (overtime < 120) {

            alert(
                "2時間別紙ルールを適用するには、\n" +
                "残業時間が2時間以上必要です。\n\n" +
                "現在の残業時間：" +
                minutesToDisplay(overtime)
            );

            return;
        }


        /*
         * 勤務表上の実働から2時間
         */

        displayWork =
            actualWork - 120;


        /*
         * 勤務表上の残業から2時間
         */

        displayOvertime =
            overtime - 120;


        /*
         * 勤務表上の退勤時間から2時間
         */

        displayEndMinutes =
            endMinutes - 120;
    }


    /* =====================================
       ⑮ 結果ラベル
    ===================================== */

    if (useSeparatePaper) {

        startResultLabel.textContent =
            "出勤時間";

        endResultLabel.textContent =
            "（勤務表上の）退勤時間";

        workLabel.textContent =
            "（勤務表上の）実働時間";

        overtimeLabel.textContent =
            "（勤務表上の）残業時間";


        /*
         * 別紙記入 2：00 を表示
         */

        separatePaperResult.classList.remove(
            "hidden"
        );

    } else {

        startResultLabel.textContent =
            "出勤時間";

        endResultLabel.textContent =
            "退勤時間";

        workLabel.textContent =
            "実働時間";

        overtimeLabel.textContent =
            "残業時間";


        /*
         * 別紙記入は非表示
         */

        separatePaperResult.classList.add(
            "hidden"
        );
    }


    /* =====================================
       ⑯ 結果の数値
    ===================================== */

    startResult.textContent =
        minutesToTimeDisplay(
            startMinutes
        );


    endResult.textContent =
        minutesToTimeDisplay(
            displayEndMinutes
        );


    workResult.textContent =
        minutesToDisplay(
            displayWork
        );


    overtimeResult.textContent =
        minutesToDisplay(
            displayOvertime
        );


    /* =====================================
       ⑰ 結果表示
    ===================================== */

    resultSection.classList.remove(
        "hidden"
    );


    /* =====================================
       ⑱ 結果までスクロール
    ===================================== */

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}