const windows_fonts = [
    "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold",
    "Calibri", "Cambria", "Candara", "Comic Sans MS", "Consolas",
    "Constantia", "Corbel", "Courier New", "Ebrima", "Franklin Gothic",
    "Gabriola", "Gadugi", "Georgia", "Impact", "Javanese Text",
    "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode",
    "Malgun Gothic", "Microsoft Himalaya", "Microsoft JhengHei",
    "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif",
    "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti",
    "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MS PGothic",
    "MS UI Gothic", "MV Boli", "Myanmar Text", "Nirmala UI",
    "Palatino Linotype", "Segoe UI", "Segoe UI Historic", "Segoe UI Emoji",
    "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen", "Symbol", "Tahoma",
    "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings",
];

const mac_fonts = [
    "Academy Engraved LET", "American Typewriter", "Andale Mono",
    "Apple Braille", "Apple Chancery", "Apple Color Emoji",
    "Apple SD Gothic Neo", "Apple Symbols", "Avenir", "Avenir Next",
    "Avenir Next Condensed", "Baskerville", "Big Caslon", "Brush Script MT",
    "Chalkboard", "Chalkboard SE", "Chalkduster", "Cochin", "Comic Sans",
    "Copperplate", "Courier", "Didot", "Futura", "Geneva", "Georgia",
    "Gill Sans", "Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text",
    "Impact", "Lucida Grande", "Luminari", "Marker Felt", "Menlo", "Monaco",
    "Noteworthy", "Optima", "Palatino", "Papyrus", "Phosphate", "Rockwell",
    "Savoye LET", "Skia", "Snell Roundhand", "Tahoma", "Times", "Trebuchet MS",
    "Verdana", "Zapfino",
];

const linux_fonts = [
    "Liberation Sans", "Liberation Serif", "Liberation Mono",
    "DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono",
    "FreeSans", "FreeSerif", "FreeMono", "URW Bookman", "URW Gothic",
    "Nimbus Sans", "Nimbus Roman", "Nimbus Mono", "Cantarell",
];

const web_fonts = [
    "Roboto", "Open Sans", "Lato", "Montserrat", "Source Sans Pro",
    "Oswald", "Raleway", "PT Sans", "Ubuntu", "Playfair Display",
    "Merriweather", "Noto Sans", "Poppins", "Inter", "Nunito",
    "Fira Sans", "Work Sans", "Quicksand", "Rubik", "Droid Sans",
    "Droid Serif", "Droid Mono", "Inconsolata", "Oxygen", "Cabin",
    "Arimo", "Tinos", "Cousine", "Bitter", "Varela Round", "Muli",
];

const all_fonts = [
    "AR PL UKai", "AR PL UMin", "ARNO PRO", "Abyssinica",
    "Academy En", "Adlam", "Adobe Deva", "Agency FB", "Al Bayan", "Al Nile",
    "Al Tarikh", "Albanian", "Algerian", "American T", "Ani", "AnjaliOldL",
    "Apple Brai", "Apple Braille Outline 6 Dot", "Apple Braille Outline 8 Dot",
    "Apple Braille Pinpoint 6 Dot", "Apple Braille Pinpoint 8 Dot", "Apple Chan",
    "Apple Colo", "Apple SD G", "Apple Symb", "AppleGothi", "AppleMyung",
    "Aqua Kana ", "AquaKana", "Arabian", "Arial Hebr", "Arial Hebrew",
    "Arial Hebrew Scholar", "Arial Narr", "Arial Roun", "Arial Unic",
    "Arial Unicode MS", "Athelas", "AvantGarde", "Avenir Bla", "Avenir Black",
    "Avenir Black Oblique", "Avenir Boo", "Avenir Book", "Avenir Hea",
    "Avenir Heavy", "Avenir Light", "Avenir Med", "Avenir Medium", "Avenir Nex",
    "Avenir Next Condensed Demi Bold", "Avenir Next Condensed Heavy",
    "Avenir Next Condensed Medium", "Avenir Next Condensed Ultra Light",
    "Avenir Next Demi Bold", "Avenir Next Heavy", "Avenir Next Medium",
    "Avenir Next Ultra Light", "Avestan", "Ayuthaya", "Baghdad", "Bahnschrif",
    "Baiti", "Bamum", "Bangla MN", "Bangla San", "Bangla Sangam MN", "BankGothic",
    "Baskervill", "Bassa Vah", "Batang", "Bauhaus 93", "Beirut", "Bell MT",
    "Berlin San", "Bhaiksuki", "Bitstream ", "Black", "Blackadder", "BlinkMacSy",
    "Bodoni 72", "Bodoni 72 ", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps",
    "Bodoni MT", "Bodoni Orn", "Bodoni Ornaments", "Book Antiq", "Bookshelf ",
    "Bradley Ha", "Bradley Hand", "Britannic ", "Broadway", "Brush Scri", "Buhid",
    "CAS", "CJK HK", "CJK JP", "CJK KR", "CJK SC", "CJK TC", "Calibri Li",
    "California", "Calisto MT", "Cambria Ma", "Candara Li", "Carian", "Castellar",
    "Caucasian ", "Centaur", "Century", "Century Go", "Century Sc", "Chalkduste",
    "Charter", "Charter Bl", "Charter Black", "Chilanka", "Chiller", "Clarendon",
    "Colonna MT", "Comic Sans MS Bold", "Cooper Bla", "Coptic", "Corbel Lig",
    "Corsiva He", "Corsiva Hebrew", "Courier 10", "Cuneiform",
    "DIN Altern", "DIN Alternate", "DIN Condensed", "Damascus",
    "DecoType Naskh", "DejaVu San", "DejaVu Ser", "DengXian", "DengXian L",
    "Devanagari", "Devanagari MT", "Devanagari Sangam MN", "Dhurjati", "Didot",
    "Diwan Kufi", "Diwan Thul", "Diwan Thuluth", "Dyuthi", "EUROSTILE",
    "Edwardian ", "Elephant", "Euphemia U", "Euphemia UCAS", "FangSong", "Farah",
    "Farisi", "Fixedsys R", "Footlight ", "FreeMono", "FreeSans", "Freestyle ",
    "Futura Bk ", "Futura Md ", "GB18030 Bi", "GB18030 Bitmap", "GOTHAM",
    "Gabriola R", "Galvji", "Gargi", "Garuda", "Gayathri", "Gayathri T",
    "Geeza Pro", "Gidugu", "Gigi", "Google San", "Goudy Old ", "Goudy Stou",
    "Gujarati M", "Gujarati MT", "Gujarati S", "Gujarati Sangam MN", "Gulim",
    "Gurmukhi M", "Gurmukhi MN", "Gurmukhi MT", "Gurmukhi S", "Gurmukhi Sangam MN",
    "Haettensch", "Harrington", "Heiti SC", "Heiti TC", "Helvetica ", "High Tower",
    "Himalaya", "Himalaya R", "Hiragino K", "Hiragino Kaku Gothic Pro",
    "Hiragino Kaku Gothic Pro W3", "Hiragino Kaku Gothic Pro W6",
    "Hiragino Kaku Gothic ProN", "Hiragino Kaku Gothic ProN W3",
    "Hiragino Kaku Gothic ProN W6", "Hiragino Kaku Gothic Std",
    "Hiragino Kaku Gothic Std W8", "Hiragino Kaku Gothic StdN",
    "Hiragino Kaku Gothic StdN W8", "Hiragino M", "Hiragino Maru Gothic Pro",
    "Hiragino Maru Gothic Pro W4", "Hiragino Maru Gothic ProN",
    "Hiragino Maru Gothic ProN W4", "Hiragino Mincho Pro",
    "Hiragino Mincho Pro W3", "Hiragino Mincho Pro W6", "Hiragino Mincho ProN",
    "Hiragino Mincho ProN W3", "Hiragino Mincho ProN W6", "Hiragino Sans",
    "Hiragino Sans GB", "Hiragino Sans GB W3", "Hiragino Sans GB W6",
    "Hiragino Sans W0", "Hiragino Sans W1", "Hiragino Sans W2", "Hiragino Sans W3",
    "Hiragino Sans W4", "Hiragino Sans W5", "Hiragino Sans W6", "Hiragino Sans W7",
    "Hiragino Sans W8", "Hiragino Sans W9", "HoloLens M", "Humanst521", "I Light",
    "I Regular", "ITF Devana", "ITF Devanagari", "ITF Devanagari Marathi",
    "Impact Reg", "Imperial A", "Imprint MT", "InaiMathi", "Informal R",
    "Ink Free", "Inscriptio", "Iowan Old ", "Iowan Old Style",
    "Iowan Old Style Black", "Jamrul", "Javanese", "Javanese T", "JhengHei R",
    "JhengHei U", "Jokerman", "KacstArt", "KacstBook", "KacstDecor", "KacstDigit",
    "KacstFarsi", "KacstLette", "KacstNaskh", "KacstOffic", "KacstOne", "KacstPen",
    "KacstPoste", "KacstQurn", "KacstScree", "KacstTitle", "Kailasa", "Kalapi",
    "Kalimati", "Kannada", "Kannada MN", "Kannada Sangam MN", "Karumbi",
    "Kayah Li", "Kefa", "Keraleeyam", "Keyboard", "Kharoshthi", "Khmer MN",
    "Khmer OS", "Khmer OS S", "Khmer Sang", "Khmer Sangam MN", "Khojki",
    "Khudawadi", "Kinnari", "Kohinoor B", "Kohinoor Bangla", "Kohinoor D",
    "Kohinoor Devanagari", "Kohinoor G", "Kohinoor Gujarati", "Kohinoor T",
    "Kohinoor Telugu", "Kokonor", "Kristen IT", "Krungthep", "KufiStanda",
    "KufiStandardGK", "Kunstler S", "LKLUG", "LT MM", "Laksaman", "Lao MN",
    "Lao Sangam", "Lao Sangam MN", "LastResort", "Lepcha", "Letter Got",
    "Levenim MT", "Light", "Likhan", "Linear A", "Linear B", "Lisu", "Lohit Assa",
    "Lohit Beng", "Lohit Deva", "Lohit Guja", "Lohit Gurm", "Lohit Kann",
    "Lohit Mala", "Lohit Odia", "Lohit Tami", "Lohit Telu", "Loma", "Lucida Bri",
    "Lucida Con", "Lucida Fax", "Lucida Gra", "Lucida Han", "Lucida San", "Lycian",
    "Lydian", "MS Gothic ", "MS PMincho", "MS Referen", "MS Sans Se", "MS Serif",
    "MS Serif R", "MS UI Goth", "MT Condens", "MYRIAD PRO", "Magneto", "Mahajani",
    "Maiandra G", "Malayalam ", "Malayalam MN", "Malayalam Sangam MN",
    "Malgun Got", "Mallanna", "Mandaic", "Manjari", "Manjari Th", "Marion",
    "Marker Fel", "Marlett", "Matura MT ", "Meera", "Meetei May", "Meiryo UI",
    "Mende Kika", "Meroitic", "Miao", "MingLiU", "MingLiU-Ex", "MingLiU_HK",
    "MingLiu-Ex", "Minion Pro", "Mishafi", "Mishafi Go", "Mishafi Gold", "Mistral",
    "Modern", "Modern No.", "Modern Reg", "Mongolian", "Mongolian ", "Mono CJK H",
    "Mono CJK J", "Mono CJK K", "Mono CJK S", "Mono CJK T", "Monotype C", "Mro",
    "Mshtakan", "Muna", "Myanmar MN", "Myanmar Sa", "Myanmar Sangam MN",
    "Myanmar Te", "NKo", "NSimSun", "NTR", "Nabataean", "Nadeem", "Nakula",
    "Navilu", "Neue", "New Penini", "New Peninim MT", "New Tai Lu", "Newa",
    "News Gothi", "Niagara En", "Niagara So", "Nimbus Mon", "Nimbus Rom",
    "Nimbus San", "Norasi", "Noto Color", "Noto Mono", "Noto Nasta",
    "Noto Nastaliq Urdu", "Noto Sans Adlam", "Noto Sans Armenian",
    "Noto Sans Avestan", "Noto Sans Bamum", "Noto Sans Bassa Vah",
    "Noto Sans Batak", "Noto Sans Bhaiksuki", "Noto Sans Brahmi",
    "Noto Sans Buginese", "Noto Sans Buhid", "Noto Sans Carian",
    "Noto Sans Caucasian Albanian", "Noto Sans Chakma", "Noto Sans Cham",
    "Noto Sans Coptic", "Noto Sans Cuneiform", "Noto Sans Cypriot",
    "Noto Sans Duployan", "Noto Sans Egyptian Hieroglyphs", "Noto Sans Elbasan",
    "Noto Sans Glagolitic", "Noto Sans Gothic", "Noto Sans Hanunoo",
    "Noto Sans Hatran", "Noto Sans Imperial Aramaic",
    "Noto Sans Inscriptional Pahlavi", "Noto Sans Inscriptional Parthian",
    "Noto Sans Javanese", "Noto Sans Kaithi", "Noto Sans Kayah Li",
    "Noto Sans Kharoshthi", "Noto Sans Khojki", "Noto Sans Khudawadi",
    "Noto Sans Lepcha", "Noto Sans Limbu", "Noto Sans Linear A",
    "Noto Sans Linear B", "Noto Sans Lisu", "Noto Sans Lycian", "Noto Sans Lydian",
    "Noto Sans Mandaic", "Noto Sans Manichaean", "Noto Sans Marchen",
    "Noto Sans Meetei Mayek", "Noto Sans Mende Kikakui", "Noto Sans Meroitic",
    "Noto Sans Miao", "Noto Sans Modi", "Noto Sans Mongolian", "Noto Sans Mro",
    "Noto Sans Multani", "Noto Sans Myanmar", "Noto Sans NKo",
    "Noto Sans Nabataean", "Noto Sans New Tai Lue", "Noto Sans Newa",
    "Noto Sans Ol Chiki", "Noto Sans Old Italic", "Noto Sans Old North Arabian",
    "Noto Sans Old Permic", "Noto Sans Old Persian", "Noto Sans Old South Arabian",
    "Noto Sans Old Turkic", "Noto Sans Oriya", "Noto Sans Osage",
    "Noto Sans Osmanya", "Noto Sans Pahawh Hmong", "Noto Sans Palmyrene",
    "Noto Sans Pau Cin Hau", "Noto Sans PhagsPa", "Noto Sans Phoenician",
    "Noto Sans Psalter Pahlavi", "Noto Sans Rejang", "Noto Sans Samaritan",
    "Noto Sans Saurashtra", "Noto Sans Sharada", "Noto Sans Sora Sompeng",
    "Noto Sans Sundanese", "Noto Sans Syloti Nagri", "Noto Sans Syriac",
    "Noto Sans Tagalog", "Noto Sans Tagbanwa", "Noto Sans Tai Le",
    "Noto Sans Tai Tham", "Noto Sans Tai Viet", "Noto Sans Takri",
    "Noto Sans Thaana", "Noto Sans Tifinagh", "Noto Sans Tirhuta",
    "Noto Sans Ugaritic", "Noto Sans Vai", "Noto Sans Warang Citi", "Noto Sans Yi",
    "Noto Serif Ahom", "Noto Serif Balinese", "Noto Serif Myanmar", "Ogham",
    "Old Englis", "Old Hungar", "Old Italic", "Old North ", "Old Permic",
    "Old Persia", "Old South ", "Old Turkic", "Oldstyle", "Onyx", "OpenSymbol",
    "Optima", "Oriya", "Oriya MN", "Oriya Sang", "Osage", "P052", "PMingLiU-E",
    "PT Mono", "PT Sans Ca", "PT Sans Caption", "PT Sans Na", "PT Sans Narrow",
    "PT Serif", "PT Serif C", "PT Serif Caption", "Padauk", "Padauk Boo", "Pagul",
    "Pahawh Hmo", "Palace Scr", "Palatino L", "Palmyrene", "Parchment",
    "Party LET", "Pau Cin Ha", "Peddana", "Perpetua", "Perpetua T", "PhangsPa",
    "Phetsarath", "Phoenician", "PingFang H", "PingFang HK", "PingFang S",
    "PingFang SC", "PingFang T", "PingFang TC", "Plantagene",
    "Plantagenet Cherokee", "Playbill", "Poor Richa", "Pothana200", "Pristina",
    "Proxy 1", "Proxy 2", "Proxy 3", "Proxy 5", "Proxy 7", "Proxy 8", "Psalter Pa",
    "Purisa", "Raanana", "Rachana", "RaghuMalay", "Ramabhadra", "Ramaraja",
    "Rasa Light", "Rasa Mediu", "Rasa SemiB", "Ravie", "Regular", "Rekha",
    "Rockwell C", "Rockwell E", "Roman", "Roman Regu", "SCRIPTINA", "SCS-ExtB",
    "SCS-ExtB R", "STFangSong", "STIXGenera", "STIXGeneral", "STIXGeneral-Bold",
    "STIXGeneral-BoldItalic", "STIXGeneral-Italic", "STIXGeneral-Regular",
    "STIXIntegr", "STIXIntegralsD", "STIXIntegralsD-Bold",
    "STIXIntegralsD-Regular", "STIXIntegralsSm", "STIXIntegralsSm-Bold",
    "STIXIntegralsSm-Regular", "STIXIntegralsUp", "STIXIntegralsUp-Bold",
    "STIXIntegralsUp-Regular", "STIXIntegralsUpD", "STIXIntegralsUpD-Bold",
    "STIXIntegralsUpD-Regular", "STIXIntegralsUpSm", "STIXIntegralsUpSm-Bold",
    "STIXIntegralsUpSm-Regular", "STIXNonUni", "STIXNonUnicode",
    "STIXNonUnicode-Bold", "STIXNonUnicode-BoldItalic", "STIXNonUnicode-Italic",
    "STIXNonUnicode-Regular", "STIXSizeFi", "STIXSizeFiveSym",
    "STIXSizeFiveSym-Regular", "STIXSizeFo", "STIXSizeFourSym",
    "STIXSizeFourSym-Bold", "STIXSizeFourSym-Regular", "STIXSizeOneSym",
    "STIXSizeOneSym-Bold", "STIXSizeOneSym-Regular", "STIXSizeTh",
    "STIXSizeThreeSym", "STIXSizeThreeSym-Bold", "STIXSizeThreeSym-Regular",
    "STIXSizeTw", "STIXSizeTwoSym", "STIXSizeTwoSym-Bold",
    "STIXSizeTwoSym-Regular", "STIXVarian", "STIXVariants", "STIXVariants-Bold",
    "STIXVariants-Regular", "STKaiti", "STSong", "STXihei", "Saab", "Sahadeva",
    "Samanata", "Samaritan", "Samyak Dev", "Samyak Guj", "Samyak Mal",
    "Samyak Tam", "Sana", "Sangam MN", "Sans Serif", "Sarai", "Sathu",
    "Saurashtra", "Sawasdee", "Script Cap", "Script ITC", "Script Reg",
    "Segoe Prin", "Segoe UI B", "Segoe UI E", "Segoe UI H", "Segoe UI L",
    "Segoe UI S", "Seravek", "Seravek Ex", "Seravek ExtraLight", "Seravek Li",
    "Seravek Light", "Seravek Me", "Seravek Medium", "Serifa", "Set", "Sharada",
    "Shavian", "Showcard G", "Shree Deva", "Shree Devanagari 714",
    "Shree Devanagari 714 Bold", "Shree Devanagari 714 Bold Italic",
    "Shree Devanagari 714 Italic", "SignPainte", "SignPainter",
    "SignPainter-HouseScript", "Silom", "SimHei", "SimSun Reg", "SimSun-Ext",
    "Sinhala MN", "Sinhala Sa", "Sinhala Sangam MN", "Sitka Bann", "Sitka Disp",
    "Small Font", "Smallcaps", "Snap ITC", "Snell Roun", "Songti SC", "Songti TC",
    "Sora Sompe", "Sree Krush", "Standard S", "Style", "Sukhumvit ", "Sundanese",
    "Superclarendon", "Suranna", "Suravaram", "Suruma", "Sylfaen Re", "Syloti Nag",
    "Symbol 7", "Symbol Reg", "Syriac", "System", "TRAJAN PRO", "TTCommons",
    "Tai Le", "Tai Tham", "Tai Viet", "Takri", "Tamil MN", "Tamil Sang",
    "Tamil Sangam MN", "Telugu MN", "Telugu San", "Telugu Sangam MN", "Tempus San",
    "Terminal", "Thaana", "Thonburi", "Tibetan Ma", "Times LT M", "Timmana",
    "Tlwg Mono", "Tlwg Typew", "Tlwg Typis", "Tlwg Typo", "Trattatell",
    "Trattatello", "Tw Cen MT", "Tw Cen MT ", "UI Light", "UI Regular",
    "UI Semibol", "URW Bookma", "URW Gothic", "Ubuntu Con", "Ubuntu Lig",
    "Ubuntu Mon", "Ubuntu Thi", "Ugaritic", "Uighur", "Ultra Bold", "Umpush",
    "Uroob", "Vai", "Vemana2000", "Viner Hand", "Vladimir S", "Vrinda",
    "Warang Cit", "Waree", "Waseem", "Webdings R", "Wide Latin", "Wingdings ",
    "Wingdings 2", "Wingdings 3", "YaHei", "YaHei Ligh", "YaHei UI", "YaHei UI L",
    "Yi Baiti R", "Yrsa", "Yrsa Light", "Yrsa Mediu", "Yrsa SemiB", "Yu Gothic",
    "Yu Gothic ", "Z003", "Zapf Dingb", "aakar",
    "padmaa", "padmaa-Bol", "utkal",
];


async function collectFonts() {
    try {
        const fonts = await detectAllFontsComprehensive();
        return {
            fonts: fonts.sort(),
        };
    } catch (err) {
        return {
            fonts: { error: err.message },
        };
    }
}

async function detectAllFontsComprehensive() {
    const detected = new Set();
    const candidates = getMassiveFontList();
    const available = await testFonts(candidates);
    available.forEach(f => detected.add(f));
    return Array.from(detected);
}

function getMassiveFontList() {
    return [].concat(
        windows_fonts,
        mac_fonts,
        linux_fonts,
        web_fonts,
        all_fonts
    );
}

async function testFonts(fontList) {
    const availableFonts = [];
    const span = document.createElement('span');
    span.style.fontSize = '72px';
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.style.top = '-9999px';
    document.body.appendChild(span);

    try {
        const baselines = {};
        const baseFamilies = ['monospace', 'serif', 'sans-serif'];

        const testStrings = [
            'mmmmmmmmmmlli',
            'wwwwwwwwww',
            'iiiiiiiiii',
            'abcdefghiJKL',
            '1234567890',
            'ÅßÇÐØÞåßçđøþ',
            'ЖжЮюЯя',
        ];

        // Collect baseline widths for each fallback
        for (const base of baseFamilies) {
            span.style.fontFamily = base;
            baselines[base] = testStrings.map(str => {
                span.textContent = str;
                return span.getBoundingClientRect().width;
            });
        }

        for (const font of fontList) {
            let detected = false;

            for (const base of baseFamilies) {
                span.style.fontFamily = `"${font}",${base}`;
                for (let i = 0; i < testStrings.length; i++) {
                    span.textContent = testStrings[i];
                    const width = span.getBoundingClientRect().width;
                    if (Math.abs(width - baselines[base][i]) > 1) {
                        detected = true;
                        break;
                    }
                }
                if (detected) break;
            }

            if (detected) availableFonts.push(font);
        }
    } finally {
        span.remove();
    }
    return availableFonts;
}
