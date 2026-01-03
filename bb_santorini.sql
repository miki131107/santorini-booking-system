-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Dic 15, 2025 alle 10:27
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bb_santorini`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `room_type` varchar(50) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `card_number` varchar(20) DEFAULT NULL,
  `expiry_date` varchar(5) DEFAULT NULL,
  `cvv` varchar(5) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_cost` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Confermata',
  `booking_date` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `name`, `surname`, `phone`, `room_type`, `payment_method`, `card_number`, `expiry_date`, `cvv`, `start_date`, `end_date`, `total_cost`, `status`, `booking_date`) VALUES
(1, 1, 'miki', 'dav', '+39 3498471305', 'Doppia', 'Contanti', NULL, NULL, NULL, '2025-12-10', '2025-12-11', 80.00, 'Confermata', '2025-12-15'),
(2, 1, 'anto', 'decic', '+39 3498471305', 'Suite', 'Carta di credito', '1234567891234567', '04/36', '789', '2025-12-10', '2025-12-11', 158.00, 'Confermata', '2025-12-15'),
(3, 1, 'miki', 'dav', '+39 3498471305', 'Doppia', 'Contanti', NULL, NULL, NULL, '2025-12-17', '2025-12-18', 83.00, 'Confermata', '2025-12-15'),
(4, 1, 'maria', '1', '+39 3498471305', 'Doppia', 'Contanti', NULL, NULL, NULL, '2025-12-23', '2025-12-27', 332.00, 'Confermata', '2025-12-15'),
(5, 1, 'Luca', 'Esposito', '+39 3498471305', 'Doppia', 'Contanti', '', '', '', '2025-12-15', '2025-12-17', 166.00, 'Confermata', '2025-12-15'),
(6, 8, 'anto', 'decic', '+39 3498471305', 'Doppia', 'Contanti', '', '', '', '2025-12-21', '2025-12-23', 166.00, 'Confermata', '2025-12-15'),
(7, 8, 'antonio', 'decicc', '+39 3457891020', 'Familiare', 'Contanti', '', '', '', '2026-12-12', '2026-12-13', 104.00, 'Confermata', '2025-12-15'),
(8, 10, 'Biagio', 'Greco', '+39 3297917547', 'Singola', 'Carta di credito', '5432100000009999', '12/30', '123', '2025-12-20', '2026-01-01', 552.00, 'Confermata', '2025-12-15');

-- --------------------------------------------------------

--
-- Struttura della tabella `rates`
--

CREATE TABLE `rates` (
  `room_type` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `rates`
--

INSERT INTO `rates` (`room_type`, `price`) VALUES
('Doppia', 83.00),
('Familiare', 104.00),
('Singola', 46.00),
('Suite', 158.00);

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('user','admin') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `status`) VALUES
(1, 'michela.dav@hmail.com', '$2b$12$eMfrSwF2wMocn.eSsIyVd.SJ8aTqyej903Cr.6DcjzvZ2Zkp9w76O', 'user'),
(2, 'admin@bbsantorini.com', '$2b$12$FYuTc2D0X9giLw62DXprlOZOozip.EaFhnOGSVRj8zUqcZOYOPaua', 'admin'),
(7, 'staiano@gmail.com', '$2b$12$Q..5IXykwHMymLWDF/wizuYZrFhI4qlc6m6uUhI0dDZy150EnZ5XC', 'user'),
(8, 'antonio.decicco@gmail.com', '$2b$12$tMbIiOyLaEke5MDmSKqdPue9CaeEiMlA3mF5QgLY/ZlrVdHD/AFbi', 'user'),
(9, 'brig81@gmail.com', '$2b$12$M6XGgnrm2dxMb4/QUbkR0eL05xLhcoqu9YHi0vbQRrStLWdtN2sgW', 'user'),
(10, 'birg81@gmail.com', '$2b$12$Shfryf5kSv6Qzu5pqdqfvu7ZsJChIY7bsQjoSD5YESWsKaGX45uwa', 'user');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indici per le tabelle `rates`
--
ALTER TABLE `rates`
  ADD PRIMARY KEY (`room_type`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
