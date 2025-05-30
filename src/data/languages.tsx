// SOURCE: https://gist.github.com/typpo/b2b828a35e683b9bf8db91b5404f1bd1#file-bcp47-locales-md
export interface Language {
    name: string;
    code: string;
}

const languages: Language[] = [
    { name: "Arabic", code: "ar-SA" },
    { name: "Bangla", code: "bn-BD" },
    { name: "Bangla", code: "bn-IN" },
    { name: "Czech", code: "cs-CZ" },
    { name: "Danish", code: "da-DK" },
    { name: "German", code: "de-AT" },
    { name: "German", code: "de-CH" },
    { name: "German", code: "de-DE" },
    { name: "Greek", code: "el-GR" },
    { name: "English", code: "en-AU" },
    { name: "English", code: "en-CA" },
    { name: "English", code: "en-GB" },
    { name: "English", code: "en-IE" },
    { name: "English", code: "en-IN" },
    { name: "English", code: "en-NZ" },
    { name: "English", code: "en-US" },
    { name: "English", code: "en-ZA" },
    { name: "Spanish", code: "es-AR" },
    { name: "Spanish", code: "es-CL" },
    { name: "Spanish", code: "es-CO" },
    { name: "Spanish", code: "es-ES" },
    { name: "Spanish", code: "es-MX" },
    { name: "Spanish", code: "es-US" },
    { name: "Finnish", code: "fi-FI" },
    { name: "French", code: "fr-BE" },
    { name: "French", code: "fr-CA" },
    { name: "French", code: "fr-CH" },
    { name: "French", code: "fr-FR" },
    { name: "Hebrew", code: "he-IL" },
    { name: "Hindi", code: "hi-IN" },
    { name: "Hungarian", code: "hu-HU" },
    { name: "Indonesian", code: "id-ID" },
    { name: "Italian", code: "it-CH" },
    { name: "Italian", code: "it-IT" },
    { name: "Japanese", code: "ja-JP" },
    { name: "Korean", code: "ko-KR" },
    { name: "Dutch", code: "nl-BE" },
    { name: "Dutch", code: "nl-NL" },
    { name: "Norwegian", code: "no-NO" },
    { name: "Polish", code: "pl-PL" },
    { name: "Portuguese", code: "pt-BR" },
    { name: "Portuguese", code: "pt-PT" },
    { name: "Romanian", code: "ro-RO" },
    { name: "Russian", code: "ru-RU" },
    { name: "Slovak", code: "sk-SK" },
    { name: "Swedish", code: "sv-SE" },
    { name: "Tamil", code: "ta-IN" },
    { name: "Tamil", code: "ta-LK" },
    { name: "Thai", code: "th-TH" },
    { name: "Turkish", code: "tr-TR" },
    { name: "Chinese", code: "zh-CN" },
    { name: "Chinese", code: "zh-HK" },
    { name: "Chinese", code: "zh-TW" },
];

export default languages;
