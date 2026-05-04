# Chapter 1: Introduction

## 1.1 Background of Study
Pet ownership in Egypt has grown significantly in recent years, creating an increasing need for organized, digital solutions that support responsible pet care. However, the current landscape of pet services—such as locating suitable mates, managing veterinary records, finding reliable pet sitters, broadcasting missing pet alerts, and purchasing pet products—is fragmented across multiple unrelated platforms. Pet owners often rely on different websites, social media pages, or physical clinics to handle these needs, resulting in inconvenience, data loss, and a lack of coordination between services. This gap highlights the need for an integrated system that brings together social interaction, community support, medical management, professional pet services, and e-commerce into a single, user-friendly solution.

PetLife Egypt addresses this challenge by proposing a unified web application that combines pet dating and matchmaking, veterinary medical record management, an online marketplace for pet products with subscription options, a community hub for missing pets and social feeds, and a directory for professional pet services (grooming, training, and boarding). Similar international platforms exist, such as Petfinder, Rover, or Chewy, but they only cover isolated functions and none provide an all-in-one service. Moreover, these services are not widely available or tailored to the Egyptian market. Research on the global pet-care sector shows a rising demand for digital health tracking tools, online pet communities, and convenient e-commerce solutions for pet supplies, demonstrating both the timeliness and necessity of such a system.

This project is important because it aims to centralize all major aspects of pet care in a single platform, improving accessibility, reducing fragmentation, and supporting pet owners, veterinarians, and local service providers. By offering organized medical records, easier access to health and grooming services, a structured matchmaking and community alert system, and convenient online purchasing with auto-ship features, PetLife Egypt contributes to better pet well-being and promotes digital transformation within the Egyptian pet-care industry. Furthermore, it supports local businesses, service providers, and veterinary clinics by giving them a structured channel to reach customers more efficiently.

Overall, the study is grounded in the need for a comprehensive, localized, and practical digital platform that bridges the existing gaps in pet management services. PetLife Egypt emerges as a timely, innovative solution that reflects both technological advancement and the evolving needs of modern pet owners.

## 1.2 Problem Statement
Pet owners in Egypt face difficulties managing essential aspects of pet care because these services are scattered across different platforms. Tasks such as finding suitable mates for pets, maintaining accurate medical and insurance records, communicating with veterinarians, booking groomers or sitters, managing recurring supply purchases, and urgently notifying the community about lost pets require using multiple unrelated websites or offline sources. This fragmentation leads to inconvenience, data inconsistency, and limited access to organized healthcare and community information.

Existing solutions, including global platforms like Petfinder, Chewy, or Rover, address only one aspect of pet care and are not available or tailored to the Egyptian market. None provide an integrated system that combines social interaction, service booking, medical tracking, community alerts, and e-commerce in one place. As a result, pet owners lack a centralized, reliable, and accessible platform to manage their pets’ overall well-being. PetLife Egypt aims to fill this gap by offering a unified web application that simplifies pet care and provides a complete digital solution for the local community.

## 1.3 Aim and Objectives
The aim of this project is to develop an integrated web application “PetLife Egypt” that unifies pet dating, community engagement, professional pet services, veterinary medical record management, and e-commerce into a single platform, making pet care more accessible, organized, and efficient for pet owners, service providers, and veterinarians.

**Specific Objectives:**
1. Develop a responsive and user-friendly web interface for pet owners to manage profiles, pets, and interactions.
2. Implement a pet-matching system that connects owners based on breed, location, age, and other relevant factors.
3. Build a comprehensive veterinary medical module that stores vaccination history, illnesses, insurance details, and enables communication between owners and veterinarians.
4. Integrate a secure e-commerce system for purchasing pet food, accessories, medicines, and supplies, including an "Auto-Ship" subscription model for recurring purchases.
5. Implement a Community and Alert module that features a social feed for pet owners and a priority location-based broadcasting system for missing and found pets.
6. Provide a booking system for professional pet services, allowing users to find and schedule grooming, behavioral training, and pet boarding/sitting.
7. Ensure data security, privacy, and smooth real-time functionality, including notifications and chatting features.
8. Support administrators, vets, service providers, and shop owners with tools to manage users, products, services, and system analytics.

## 1.4 Scope of the Project
**In-Scope:**
The PetLife Egypt system includes five core modules that work together within a unified web platform:
1. **Pet Dating & Community Module:** Pet owner profiles, pet sub-profiles, search and matching system, social feed for community interactions, missing/found pet alerts, and chat between pet owners.
2. **Medical Management Module:** Digital health records, vaccination history, illnesses, insurance record integration, and communication between pet owners and veterinarians. It also provides recommendations for nearby clinics and hospitals.
3. **Professional Pet Services Module:** Profiles and booking functionalities for verified pet service providers, including groomers, behavioral trainers, and pet sitters/boarders.
4. **E-Commerce Module:** Product catalog (food, accessories, medicines), cart, checkout, order tracking, recurring "Auto-Ship" subscriptions, and secure online payment.
5. **Admin Dashboard:** Management of users, veterinarians, service providers, products, and system statistics.
6. **Technical Scope:** Developed using React (frontend), ASP.NET Core (backend), SQL database, and hosted on Azure/Supabase following a Waterfall methodology.

**Out-of-Scope (What the Project Does Not Include):**
1. Physical veterinary services or emergency assistance.
2. Real-time GPS tracking of pets beyond location-based matching, community alerts, and clinic recommendations.
3. Delivery logistics management (handled by store owners or third parties, not the system).
4. Advanced AI-based medical diagnosis beyond simple suggestions.
5. A native mobile application (the project is limited to a web platform).

**Project Constraints:**
• Time constraints: Development will follow sprint-based progress, limiting how many advanced features can be implemented within the project period.
• Data limitations: Availability of reliable local veterinary data and hospitals may affect the accuracy of location-based recommendations.
• Technical constraints: System performance depends on server hosting capacity and Internet availability.
• Resource constraints: No specialized hardware is required; all features depend only on web technologies and available datasets.

## 1.5 Significance of the Project
The PetLife Egypt platform provides significant value by addressing the fragmented nature of pet services in the Egyptian market. Pet owners benefit the most, as the system centralizes essential functions—pet dating, finding a lost pet through community alerts, medical record management, communication with veterinarians, booking groomers or sitters, and automated online shopping—into one accessible platform. This integration simplifies daily pet care and ensures more organized, reliable handling of health information and pet-related needs.

Veterinarians gain from the project through improved client management, easier access to pet medical histories, and a direct communication channel with owners. Independent service providers (groomers, trainers, sitters) and local pet shops benefit by gaining an online presence, allowing them to sell products or services more efficiently and reach a wider audience.

The project carries broader significance by encouraging digital transformation in the pet-care sector. It introduces an innovative, unified solution not currently available in Egypt, bridging gaps in social interaction, healthcare management, service booking, and e-commerce for pet owners. By providing a comprehensive and localized platform, PetLife Egypt supports better pet welfare, enhances service accessibility, and creates opportunities for growth within the veterinary and pet-supplies industries.

## 1.6 Project Methodology (Brief Overview)
The development of PetLife Egypt follows a Waterfall methodology, where the project progresses through sequential and well-defined phases. Each phase—requirements gathering, system design, implementation, testing, deployment, and maintenance—is completed before moving on to the next. This linear approach ensures clear documentation, predictable timelines, and a structured progression that minimizes changes during development.

From a technical perspective, the project adopts a modern full-stack architecture. The frontend is built using HTML5, CSS3, JavaScript, and React.js to ensure a responsive and user-friendly interface. The backend uses ASP.NET Core with RESTful APIs to handle authentication, pet management, medical records, service bookings, e-commerce operations, and real-time communication. A SQL database is used to store structured data securely and efficiently. The system will be deployed on Azure or Supabase, ensuring scalability and reliability.

Security measures and best practices are integrated throughout the entire development lifecycle to protect user information and maintain data privacy. The Waterfall methodology provides a clear, structured framework that supports thorough planning and documentation, enabling the delivery of a robust and integrated pet-care platform.

## 1.7 Project Organization
This documentation is organized into three main chapters, each focusing on a specific aspect of the PetLife Egypt project.
**Chapter 1: Introduction**
This chapter presents the background of the study, defines the problem statement, and explains the aim, objectives, scope, and significance of the project. It also provides a brief overview of the project methodology and introduces the overall structure of the report.
**Chapter 2: Literature Review**
This chapter reviews existing systems and related studies in the field of pet-care platforms. It compares current solutions, identifies their limitations, and highlights the research gap that motivates the development of the proposed PetLife system.
**Chapter 3: System Analysis and Design**
This chapter describes the proposed system in detail, including functional and non-functional requirements, system architecture, system environment, and design models. It presents diagrams such as use case, class, activity, and sequence diagrams to illustrate system behavior and structure. 

---

# Chapter 3: System Analysis and Design

## 3.1 Overview
PetLife Egypt is proposed as an all-in-one web platform designed to unify the essential services that pet owners typically access from separate sources. The system integrates five major domains: pet social interaction (dating, community feed, and missing pet alerts), professional pet services (grooming, training, boarding), veterinary medical management, and e-commerce into one seamless digital environment. Through this integration, the platform aims to reduce the fragmentation faced by pet owners and provide a more convenient, efficient, and organized experience.

At its core, the system allows pet owners to create detailed profiles for themselves and their pets, enabling features such as pet matching and broadcasting community alerts. The platform also provides a dedicated medical module where users can store and track vaccination records, illnesses, insurance details, and treatment histories, while veterinarians can communicate with pet owners and access relevant health information easily.

The newly integrated services module empowers users to book reliable pet sitters, groomers, and trainers. The e-commerce module further enhances the system by offering a marketplace for pet food, accessories, medicines, and other products, complete with auto-ship subscription options. An integrated admin dashboard supports overall system management, allowing administrators to oversee users, veterinarians, service providers, and products, generating insights that help maintain platform quality.

## 3.2 Functional Requirements

### 1. Pet Owner Requirements
1. **FR-PO-01** The Pet Owner shall be able to sign up and log in securely.
2. **FR-PO-02** The Pet Owner shall be able to log out of the system.
3. **FR-PO-03** The Pet Owner shall be able to update personal details such as name, location, and contact information.
4. **FR-PO-04** The Pet Owner shall be able to add, edit, and delete pet profiles, including adding pet insurance details.
5. **FR-PO-05** The Pet Owner shall be able to search for pets for companionship or adoption.
6. **FR-PO-06** The Pet Owner shall be able to filter search results by distance, type, breed, age, gender, and location.
7. **FR-PO-07** The Pet Owner shall be able to accept or decline pet matches.
8. **FR-PO-08** The Pet Owner shall be able to search for veterinarians, clinics, or specialized pet service providers (groomers, trainers, sitters).
9. **FR-PO-09** The Pet Owner shall be able to select and book veterinary or professional pet services.
10. **FR-PO-10** The Pet Owner shall be able to consult veterinarians and service providers through chat.
11. **FR-PO-11** The Pet Owner shall be able to track consultation and booking progress and view history.
12. **FR-PO-12** The Pet Owner shall be able to chat with other pet owners for the purpose of pet matching.
13. **FR-PO-13** The Pet Owner shall be able to view and manage their pet’s medical records.
14. **FR-PO-14** The Pet Owner shall be able to browse and purchase pet-related products.
15. **FR-PO-15** The Pet Owner shall be able to add products to a shopping cart.
16. **FR-PO-16** The Pet Owner shall be able to select a payment method during checkout.
17. **FR-PO-17** The Pet Owner shall be able to place an order for selected products and optionally set up a recurring "Auto-Ship" subscription.
18. **FR-PO-18** The Pet Owner shall be able to track order status, subscription status, and view order history.
19. **FR-PO-19** The Pet Owner shall be able to rate and review veterinarians, clinics, service providers, and purchased products.
20. **FR-PO-20** The Pet Owner shall be able to manage notification preferences and privacy settings, including the option to deactivate or delete their account.
21. **FR-PO-21** The Pet Owner shall be able to submit adoption requests.
22. **FR-PO-22** The Pet Owner shall be able to respond to adoption requests received from other users.
23. **FR-PO-23** The Pet Owner shall be able to send match requests to other pet owners.
24. **FR-PO-24** The Pet Owner shall be able to find the nearest veterinary clinic, shop, or service provider.
25. **FR-PO-25** The Pet Owner shall be able to get directions to a selected clinic or service location.
26. **FR-PO-26** The Pet Owner shall be able to post "Missing Pet" or "Found Pet" alerts that notify nearby users.
27. **FR-PO-27** The Pet Owner shall be able to post updates, photos, and interact with a community social feed.

### 2. Veterinarian Requirements
1. **FR-VET-01** The Veterinarian shall be able to register and log in securely, with additional verification fields such as license number and specialization. Accounts shall be flagged as “Pending Approval” until verified by an Admin.
2. **FR-VET-02** The Veterinarian shall be able to log out of the system.
3. **FR-VET-03** The Veterinarian shall be able to submit professional credentials for verification, including scanned documents such as license and ID.
4. **FR-VET-04** The Veterinarian shall be able to provide consultation via chat with pet owners.
5. **FR-VET-05** The Veterinarian shall be able to mark their online status for availability.
6. **FR-VET-06** The Veterinarian shall be able to start and end consultations, logging consultation time and linking chat and notes to the pet’s medical record.
7. **FR-VET-07** The Veterinarian shall be able to view a pet’s medical history, including previous records, insurance details, and vaccination logs.
8. **FR-VET-08** The Veterinarian shall be able to add notes, recommendations, or reviews to a pet’s medical record, including diagnoses, treatments, and prescriptions.

### 3. Service Provider Requirements (Groomers, Trainers, Sitters)
1. **FR-SP-01** The Service Provider shall be able to register and log in securely, submitting required credentials (certifications or ID) for Admin approval.
2. **FR-SP-02** The Service Provider shall be able to manage their service catalog, availability schedule, and pricing.
3. **FR-SP-03** The Service Provider shall be able to accept, decline, and manage booking requests from Pet Owners.
4. **FR-SP-04** The Service Provider shall be able to chat with clients regarding upcoming appointments.

### 4. Shop Owner Requirements
1. **FR-SO-01** The Shop Owner shall be able to register and log in securely, with additional verification fields such as license number and ID. Accounts shall be flagged as “Pending Approval” until verified by an Admin.
2. **FR-SO-02** The Shop Owner shall be able to log out of the system.
3. **FR-SO-03** The Shop Owner shall be able to submit professional credentials for verification, including business license or registration certificate, which must be approved by an Admin.
4. **FR-SO-04** The Shop Owner shall be able to add, edit, and remove products through the Shop Management Panel, with validations for name, price, stock, and images.
5. **FR-SO-05** The Shop Owner shall be able to view and manage active subscriptions/auto-shipments for their products.
6. **FR-SO-06** The Shop Owner shall be able to contact customers via order chat or integrated messaging for order issues or queries.
7. **FR-SO-07** The Shop Owner shall be able to assign delivery to delivery personnel, updating order status and sending notifications.
8. **FR-SO-08** The Shop Owner shall be able to view and manage orders, with filtering by status, customer name, or date.
9. **FR-SO-09** The Shop Owner shall be able to track inventory, including automatic updates after orders and low-stock alerts.

### 5. System Administrator Requirements
1. **FR-ADM-01** The System Administrator shall be able to log in securely to access the admin dashboard, with access restricted to users having the Admin role.
2. **FR-ADM-02** The System Administrator shall be able to manage accounts for Pet Owners, Veterinarians, Service Providers, and Shop Owners, including activating, deactivating, or deleting accounts.
3. **FR-ADM-03** The System Administrator shall be able to control access permissions based on user roles, ensuring each actor sees only the modules they are permitted to access.
4. **FR-ADM-04** The System Administrator shall be able to verify and approve user accounts, reviewing submitted credentials and documents from professionals.
5. **FR-ADM-05** The System Administrator shall be able to view analytics on order statuses, subscriptions, and platform activity.
6. **FR-ADM-06** The System Administrator shall be able to monitor overall inventory across the platform, with aggregated reports and analytics generated periodically.

## 3.3 Non-Functional Requirements
### 1. Performance Requirements
• The system should respond quickly, ideally within 1-3 seconds for most actions.
• Searching and filtering pets, products, services, or vets must remain fast even with many records.
• Real-time chat messages and notifications must be delivered almost instantly, with minimal delay. The application should handle multiple users at the same time without slowing down.

### 2. Usability Requirements
• The interface should be simple, clean, and easy for pet owners to use.
• Users should be able to register, log in, and navigate the system without confusion.
• Buttons, menus, and forms must be clearly labeled.
• The system must work smoothly on both laptops and mobile phones.
• Error messages should be friendly and explain what the user needs to fix.

### 3. Reliability Requirements
• The system should work consistently without crashing.
• Important data (medical records, pet profiles, orders, chats, subscriptions) must never be lost.
• Backups should run regularly to protect data in case of failure.
• Chats and notifications should still work even if the internet connection is weak.
• System uptime should be high so users can access the app anytime.

### 4. Security Requirements
• All users must log in securely, and passwords must be protected.
• Only the right roles (owners, vets, admins, service providers, shop owners) should access certain features.
• Sensitive data such as medical records, insurance info, and payments must be encrypted and hidden from unauthorized users.
• The system must protect against common attacks like SQL injections, and brute-force logins.
• Payment processing must follow secure standards (e.g., PayMob security rules).

### 5. Scalability Requirements
• The system should be able to grow if more users join.
• The database and server should support more pets, products, services, users, and messages without slowing down.
• Chat and notifications should still work properly even when many users are online.
• The architecture should support future feature additions without major redesign.

### 6. Notifications and Communication
• Notifications must be delivered promptly.
• **Critical Priority:** Missing pet alerts must be prioritized and broadcasted immediately via push notification to nearby users.
• Failed notifications should automatically retry.
• Notifications should never be lost.
• Users should be able to view all past notifications.

### 7. E-Commerce and Subscription Operations
• Shop pages should load smoothly.
• Inventory and stock must stay accurate.
• Subscription auto-orders must be generated accurately at the scheduled intervals without user intervention.
• Orders must be processed reliably even with many users online.
• The system should prevent duplicate or missing orders.

*(Other Non-Functional requirements regarding Location-Based Services, Payment Management, Admin Control, Pet Profile Management, Matchmaking, and Vet Consultation remain identical to standard platform operations).*

## 3.4 System Environment
The PetLife Egypt platform operates within a modern full-stack web environment, requiring specific hardware and software components for development, deployment, and user operation.

**1. Hardware Environment:**
**For End Users (Pet Owners, Vets, Service Providers, Shop Owners, Admin)**
• Any device capable of running a modern web browser:
  - Desktop or laptop (Windows, macOS, Linux)
  - Smartphone or tablet (Android, iOS)
• Minimum recommended specifications:
  - 4 GB RAM
  - Dual-core processor
  - Stable internet connection (4G/5G/Wi-Fi)

**For Development Team**
• Development machines with:
  - 8 GB RAM or higher
  - Quad-core processor
  - 10–20 GB storage for development tools, frameworks, and local database
  - Internet connection for API integration and version control

**For Server / Hosting**
• Cloud hosting environment (Azure or Supabase) that supports:
  - Virtual servers for backend hosting
  - SQL Database hosting
  - Blob storage for uploaded files (credentials, product images, community photos)
