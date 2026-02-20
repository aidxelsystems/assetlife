SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `prefecture` VARCHAR(10) DEFAULT 'Tokyo',
  `city` VARCHAR(50) DEFAULT NULL,
  `land_size` VARCHAR(50) DEFAULT NULL,
  `building_age` VARCHAR(50) DEFAULT NULL,
  `address_detail` TEXT DEFAULT NULL,
  `result_token` VARCHAR(64) DEFAULT NULL,
  `policy_agreed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_result_token` (`result_token`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `simulations`;
CREATE TABLE `simulations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `age` INT NOT NULL,
  `health_status` VARCHAR(50) NOT NULL,
  `pension` INT NOT NULL,
  `savings` INT NOT NULL,
  `property_value_estimate` INT NOT NULL,
  `result_asset_lifespan` INT NOT NULL,
  `calculated_monthly_cost` INT NOT NULL,
  `calculated_initial_cost` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sim_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `route_type` ENUM('A', 'B', 'C') NOT NULL,
  `selected_services` TEXT NOT NULL,
  `urgency` VARCHAR(50) DEFAULT NULL,
  `contact_time` VARCHAR(50) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_lead_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `market_data`;
CREATE TABLE `market_data` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `city` VARCHAR(50) NOT NULL,
  `monthly_fee` INT NOT NULL DEFAULT 250000,
  `initial_fee` INT NOT NULL DEFAULT 5000000,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `market_data` (`city`, `monthly_fee`, `initial_fee`) VALUES
('港区', 400000, 15000000),
('千代田区', 380000, 12000000),
('東京都平均', 250000, 5000000); 

SET FOREIGN_KEY_CHECKS = 1;
