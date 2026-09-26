<div align="center">

# 📝 QP Generator - Physics Question Paper Generator

![GitHub stars](https://img.shields.io/github/stars/harishc-dev/QP-Generator?style=social)
![GitHub forks](https://img.shields.io/github/forks/harishc-dev/QP-Generator?style=social)
![GitHub issues](https://img.shields.io/github/issues/harishc-dev/QP-Generator)
![GitHub license](https://img.shields.io/github/license/harishc-dev/QP-Generator)

### 🎓 A Modern Desktop Application for Automated Question Paper Generation

**Create professional CBSE Physics question papers in seconds with intelligent question selection and DOCX export**

![Electron](https://img.shields.io/badge/Electron-29.0-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?logo=node.js&logoColor=white)
![DOCX](https://img.shields.io/badge/DOCX-8.5.0-2B579A?logo=microsoft-word&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-Ready-0078D6?logo=windows&logoColor=white)

</div>

---

## 📸 Preview
<img width="1366" height="731" alt="image" src="https://github.com/user-attachments/assets/c8e5ac37-d5bc-4350-89a8-9414c2cba20a" />
<img width="1366" height="728" alt="image" src="https://github.com/user-attachments/assets/c24ce72c-79c3-4ef3-930f-48078cf58ffb" />

<div align="center">
  
*A sleek, modern desktop application for generating CBSE Physics question papers*

</div>

---

## 💡 What is QP Generator?

**QP Generator** is a powerful desktop application built with Electron that automates the creation of CBSE Physics question papers. It intelligently parses question banks from DOCX files, allows customized question selection by chapter and type, and exports professional, exam-ready papers with optional answer keys.

### 🎯 Core Purpose

- **⚡ Automated Generation** - Create complete question papers in seconds
- **📚 Smart Question Bank** - Upload and manage DOCX question files by chapter
- **🎲 Intelligent Selection** - Advanced weighted selection algorithm prioritizes important questions
- **📄 Professional Export** - Generate properly formatted DOCX papers with school headers
- **🔒 Local-First** - All data stored locally with no internet dependency
- **🎨 Modern UI** - Clean, gradient-based interface with smooth animations

---

## ✨ Key Features

### 📤 **Question Bank Management**
- **DOCX File Upload** - Drag-and-drop or browse to upload question files
- **Chapter Organization** - Automatic parsing of 14 CBSE Physics chapters
- **Question Types** - Supports MCQ, Assertion-Reason, Short, Q&A, Long Answer, and Case Study
- **Smart Parsing** - Automatic extraction of questions and answers from formatted DOCX files
- **Local Storage** - Questions stored in app data directory for quick access

### 🎯 **Intelligent Paper Generation**
- **Custom Selection** - Choose exact number of questions per chapter and type
- **Weighted Algorithm** - Priority boosting for important questions (marked with [True])
- **6 Question Types**:
  - Section A: MCQ (1 mark)
  - Section B: Assertion-Reason (1 mark)
  - Section C: Short Answer (2 marks)
  - Section D: Q&A (3 marks)
  - Section E: Long Answer (5 marks)
  - Section F: Case Study (4 marks)
- **Live Preview** - See your paper before exporting
- **Answer Key Toggle** - Include or exclude answers in generated paper

### 📄 **Professional Document Export**
- **DOCX Format** - Industry-standard Word document output
- **School Header** - Customizable school information (name, year, grade, marks, time)
- **Proper Formatting** - Numbered questions, sectioned layout, professional styling
- **Auto-naming** - Files named with timestamp for easy tracking
- **Generated Papers Library** - View and open all previously generated papers

### 🎨 **User Experience**
- **Custom Titlebar** - Frameless window with minimize, maximize, close controls
- **Gradient Theme** - Purple-indigo gradient design with modern aesthetics
- **Sidebar Navigation** - Easy access to Home, Generate, Upload, and View sections
- **Drag-and-Drop** - Intuitive file upload experience
- **Responsive Layout** - Clean cards and organized UI elements

### 🔧 **Technical Features**
- **Electron Framework** - Cross-platform desktop application
- **Mammoth.js** - Reliable DOCX parsing
- **DOCX Library** - Professional document generation
- **IPC Communication** - Secure main-renderer process communication
- **Persistent Storage** - LocalStorage for question data, AppData for files
- **Error Handling** - Comprehensive logging and error recovery

---

## 🛠️ Built With

| Category | Technologies |
|----------|-------------|
| **Desktop Framework** | Electron 29.0 |
| **Runtime** | Node.js |
| **UI** | HTML5, CSS3, Vanilla JavaScript |
| **Document Parsing** | Mammoth.js 1.10.0 |
| **Document Generation** | DOCX 8.5.0 |
| **Build Tool** | Electron Builder 24.6.0 |

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js v16+
npm or yarn
Windows OS (for installer)
```

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/harishc-dev/QP-Generator.git
   cd QP-Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm start
   ```

4. **Build installer (Windows)**
   ```bash
   npm run dist
   ```

5. **Installer Location**
   ```
   dist/QP Generator Setup.exe
   ```

---

## 📂 Project Structure

```
qpgen-electron/
├── main.js                  # Electron main process
├── preload.js               # Secure IPC bridge
├── renderer.js              # UI logic and interactions
├── index.html               # Main application UI
├── styles.css               # Global styles
├── package.json             # Dependencies & scripts
├── utils/
│   ├── questionParser.js    # DOCX parsing logic
│   └── docxExport.js        # Paper generation logic
├── assets/                  # App resources
├── icon/                    # Application icons
│   ├── iconn.png
│   └── iconn.ico
└── qp/                      # Question bank folder (user data)
```

---

## 📖 How It Works

### 1. **Upload Question Bank**
- Navigate to **Upload** section
- Drag-and-drop `.docx` files containing questions
- Files must follow the format:
  ```
  Chapter: 1
  I          (MCQ section)
  1. Question text here?
  Ans: Answer text here
  
  II         (Assertion section)
  2. Another question?
  Ans: Answer here
  ```
- Questions marked with `[True]` get priority in selection

### 2. **Generate Paper**
- Go to **Generate** section
- Each chapter shows 6 question type selectors
- Use `+` / `-` buttons to choose question count
- Select "Include answers in output" if needed
- Click **Generate Paper Preview** to see the paper
- Click **Export to DOCX** to save

### 3. **View Generated Papers**
- Navigate to **View** section
- See all previously generated papers
- Click **Open** to view paper in Word
- Click **Delete** to remove from list

---

## 🎨 Features Showcase

| Feature | Description |
|---------|-------------|
| **📊 Smart Weighting** | Questions marked with [True] have 3x higher selection probability |
| **🎲 Random Selection** | Each generation produces unique paper variations |
| **📝 Complete Sections** | Supports all CBSE question paper sections (A-F) |
| **⚙️ Custom Headers** | School name, exam title, marks, time automatically formatted |
| **🔄 Persistent Data** | Questions remain available across app sessions |
| **📁 File Management** | Organized storage in `AppData/QPGen` directory |

---

## 🎓 Supported Chapters

The application supports all 14 CBSE Class XI Physics chapters:

1. Units and Measurements
2. Motion in a Straight Line
3. Motion in a Plane
4. Laws of Motion
5. Work, Energy and Power
6. System of Particles and Rotational Motion
7. Gravitation
8. Mechanical Properties of Solids
9. Mechanical Properties of Fluids
10. Thermal Properties of Matter
11. Thermodynamics
12. Kinetic Theory
13. Oscillations
14. Waves

---

## 🗺️ Roadmap

Future enhancements planned:

- [ ] Support for other subjects (Chemistry, Mathematics, Biology)
- [ ] Multi-class support (Class IX, X, XII)
- [ ] Question difficulty levels
- [ ] Custom marking schemes
- [ ] PDF export option
- [ ] Question statistics and analytics
- [ ] Cloud sync for question banks
- [ ] Template library for different exam formats
- [ ] Mac and Linux support

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Harish C**

[![Portfolio](https://img.shields.io/badge/Portfolio-harishc--dev.netlify.app-00D9FF?style=flat-square&logo=google-chrome&logoColor=white)](https://harishc-dev.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-harishc--dev-181717?style=flat-square&logo=github)](https://github.com/harishc-dev)

---

## 🙏 Acknowledgments

- **Mammoth.js** - For reliable DOCX parsing
- **DOCX Library** - For professional document generation
- **Electron** - For enabling cross-platform desktop development
- **CBSE** - For standardized question paper formats

---

## ⭐ Show Your Support

If you find this project helpful for your teaching or educational needs, please consider giving it a ⭐ on GitHub!

---

<div align="center">

**Made with ❤️ by Harish C**

*Simplifying question paper creation, one paper at a time.*

</div>






