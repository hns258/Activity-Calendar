/*
 * Activity Calendar 2021: DB Script
 * Created on: 10/9/2021
 * Developer: Azhya Knox
 * 
 * DB Structure can be seen on the ERD (attached).
 * 
 * Sections:
 * 1) Create Table statements
 * 2) Insertion of dummy data
 * 3) Select statements
 * 4) Delete table statements
 */

-- Creation statements (4 tables)
create table "users"
(
	[id] integer primary key autoincrement not null,
	[ip-address] varchar(150) not null unique
);

create table "imageType"
(
	[id] integer primary key autoincrement not null,
	[name] varchar(150)
);

create table "settings"
(
	[id] integer primary key autoincrement not null,
	[userId] integer,
	[folderLocation] varchar(150),
	[imagesList] varchar(500) not null,
	FOREIGN KEY(userId) REFERENCES users(id)
);

create table "images"
(
	[id] integer primary key autoincrement not null,
	[name] varchar(150),
	[location] varchar(500),
	[typeId] integer not null,
	FOREIGN KEY(typeId) REFERENCES imageType(id)
);

-- Insertion of dummy data
insert into "users" ([ip-address]) values("fakeip.770.0.7");

insert into "imageType" ([name]) values("People");
insert into "imageType" ([name]) values("Activity");
insert into "imageType" ([name]) values("Transport");
insert into "imageType" ([name]) values("Popular");

INSERT into "settings" (userId, folderLocation, imagesList) values(1, "C:\Users\AzhyaKnox\Desktop\Activity-Calender\locations", "{4}");
INSERT into "settings" (userId, folderLocation, imagesList) values(1, "C:\Users\AzhyaKnox\Desktop\Activity-Calender\transporation", "{3}");
INSERT into "settings" (userId, folderLocation, imagesList) values(1, "C:\Users\AzhyaKnox\Desktop\Activity-Calender\activities", "{2}");
INSERT into "settings" (userId, folderLocation, imagesList) values(1, "C:\Users\AzhyaKnox\Desktop\Activity-Calender\people", "{1}");

insert into "images" ([name], [location], [typeId]) values("Jack", "C:\Users\AzhyaKnox\Desktop\Activity-Calender\people\jack.png", 1);
insert into "images" ([name], [location], [typeId]) values("Dancing", "C:\Users\AzhyaKnox\Desktop\Activity-Calender\activities\dancing.png", 2);
insert into "images" ([name], [location], [typeId]) values("Walking", "C:\Users\AzhyaKnox\Desktop\Activity-Calender\transportation\walking.png", 3);
insert into "images" ([name], [location], [typeId]) values("Aylesbury", "C:\Users\AzhyaKnox\Desktop\Activity-Calender\locations\Aylesbury.png", 4);

-- Select statements
select * from "users";

select * from imageType;

select * from settings where userId = 1;

select * from images;

-- Deletion statements
drop table users;

drop table imageType;

drop table settings;

drop table images;

-- END OF FILE