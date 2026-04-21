-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: mobile_shop
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,2,999.00,'2026-04-09 10:09:47'),(2,2,1,1,999.00,'2026-04-09 10:12:33'),(3,2,2,1,899.00,'2026-04-09 10:12:33'),(4,3,1,1,999.00,'2026-04-14 11:45:53'),(5,4,2,1,899.00,'2026-04-15 15:32:24'),(6,4,5,1,749.00,'2026-04-15 15:32:24'),(7,5,2,1,899.00,'2026-04-15 15:33:05'),(8,6,2,1,899.00,'2026-04-15 15:34:37'),(9,6,3,1,799.00,'2026-04-15 15:34:37'),(10,7,1,5,999.00,'2026-04-16 13:52:48'),(11,8,1,1,999.00,'2026-04-16 14:29:15'),(12,8,2,1,899.00,'2026-04-16 14:29:15');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `STATUS` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,3,1998.00,'NEW','2026-04-09 10:09:47'),(2,2,1898.00,'NEW','2026-04-09 10:12:33'),(3,5,999.00,'NEW','2026-04-14 11:45:53'),(4,6,1648.00,'NEW','2026-04-15 15:32:24'),(5,6,899.00,'NEW','2026-04-15 15:33:05'),(6,6,1698.00,'NEW','2026-04-15 15:34:37'),(7,7,4995.00,'NEW','2026-04-16 13:52:48'),(8,8,1898.00,'NEW','2026-04-16 14:29:15');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'iPhone 15','',999.00,0,'2026-04-09 09:41:55'),(2,'Samsung Galaxy S24','',899.00,0,'2026-04-09 09:41:55'),(3,'Google Pixel 9','',799.00,0,'2026-04-09 09:41:55'),(4,'Xiaomi 14','',699.00,0,'2026-04-09 09:41:55'),(5,'OnePlus 13','',749.00,0,'2026-04-09 09:41:55'),(7,'iphone16','',2000.00,1,'2026-04-16 14:31:38');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `PASSWORD` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test User','testb632b163@example.com','$2b$10$pY8.7IgWIxHe7AuVlGUmAOUCmG93OO1Cn3BuE35OPkIL5KAoN3kTe','2026-04-09 10:01:21',0),(2,'test20','test20@gmail.com','$2b$10$RLAVW/Db2r6f2ODtgOv4luf1R6y14o5pI8nIHfG1xId87hlty8vNq','2026-04-09 10:04:51',0),(3,'Cart User','cart1a5af243@example.com','$2b$10$/0gE8CXwNHTG50vL2HAVMujjYw0VM5xDVzDrHqohRhhO7WJCQkZy.','2026-04-09 10:09:47',0),(4,'Admin','admin@mobileshop.local','$2b$10$vQGPlAj.pLadsL48PIYkeOh1UYfcA//OvCm9DJqWtjLuCZEyusEeC','2026-04-09 20:55:03',1),(5,'Test User','testuser1@mail.com','$2b$10$zUoHhPZh0uktl8Orw4FnK.MqQubkYXFup17LlIKGVKP5gkNmcKrNq','2026-04-14 11:42:47',0),(6,'test100','test100@gmail.com','$2b$10$pFpaH5QMAsBjgypDDxWpyeGcSn4xfOmkuqqoCEbjV1/HjT2Hq8AKe','2026-04-15 15:32:14',0),(7,'testmmm','test19923@gmail.com','$2b$10$ioRUzFrp8T7rqlylOO7mC.WrepbnQSEdKWsbFboINOFk/bYvbeGBW','2026-04-16 13:52:34',0),(8,'testt','test200@gmail.com','$2b$10$xTh/wpW39p7WmTJi4bmQb.1T19yPItqauXDen6miTxMw/cDv4P3/y','2026-04-16 14:29:05',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-21 20:40:17
