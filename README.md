# Mobile_Rian - React Native App  

**Mobile_Rian** is a modern, lightweight React Native app built with TypeScript, showcasing clean UI/UX, efficient API data handling, and well-structured component testing. Developed for technical interview purposes.  

---

## App Screenshot  

<p align="center">  
  <img src="src/assets/screenshots/screenshot-iphone.png" alt="Mobile_Rian Screenshot" width="300" />  
</p>  

---

## Key Features  

- Modern stack navigation using `@react-navigation`  
- Customizable dropdown input with `react-native-element-dropdown`  
- Data fetching and display using `axios` & `@tanstack/react-query`  
- Lightweight toast notifications using `react-native-toast-message`  
- Responsive styling with `react-native-size-matters` and `react-native-svg`  
- Safe and reactive UI with `SafeAreaView` and `gesture-handler`  
- Performance optimizations with `blur`, `safe-area`, and `screens` support  

---

## Tech Stack and Libraries  

| Library                            | Description                                           |  
| ---------------------------------- | ----------------------------------------------------- |  
| **React Native 0.77.0**            | Core framework for mobile app development            |  
| **React 18.3.1**                   | UI library for building components                   |  
| **React Navigation**               | Navigation between screens                           |  
| **TanStack React Query v5**        | Efficient async data management                      |  
| **Axios**                          | HTTP client for API/backend requests                 |  
| **React Native Toast Message**     | Lightweight toast notification system                |  
| **React Native Element Dropdown**  | Customizable dropdown component                      |  
| **React Native SVG**               | SVG vector graphics support                          |  
| **React Native Safe Area Context** | Handles safe display on notched and bezel devices    |  
| **React Native Gesture Handler**   | High-performance gesture interactions                |  
| **React Native Blur**              | Aesthetic blur effects in UI                         |  

---

## Minimum Requirements  

- Node.js >= 18  
- Android Studio or Xcode (for running on emulator)  
- Dependencies are managed in `package-lock.json`  

---

## Testing  

Testing is configured using **Jest** and **React Test Renderer**. Unit test setup is in place to ensure component and logic quality throughout the application.  

---

## Notes  

This project was developed as a **technical demonstration** for interview purposes, showcasing:  

- **Core React Native competencies** (navigation, state, API integration)
- **TypeScript best practices** (type safety, interfaces, generics)  
- **Production-grade architecture** (modular components, clean hooks)
- **Performance considerations** (memoization, query optimization)  

**Key Implementation Details:**  
- **Data Layer**: TanStack Query for efficient caching/refetching strategies  
- **UI Consistency**: Responsive scaling with `react-native-size-matters`  
- **Developer Experience**: Pre-configured tooling (Jest, TypeScript paths)  
- **Extensibility**: Designed for easy feature additions  

---  

**Made with ❤️ using React Native & TypeScript**  
