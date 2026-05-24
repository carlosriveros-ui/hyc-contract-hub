-- =============================================
-- HYC Contract Hub — Schema completo + Seed
-- Corre esto en Supabase SQL Editor
-- =============================================

-- TABLAS
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  "contractIds" TEXT[] DEFAULT '{}',
  "siteIds" TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  nit TEXT DEFAULT '',
  "contactName" TEXT DEFAULT '',
  "contactPhone" TEXT DEFAULT '',
  "totalValue" NUMERIC DEFAULT 0,
  "monthlyBudget" NUMERIC DEFAULT 0,
  "startDate" TEXT DEFAULT '',
  "endDate" TEXT DEFAULT '',
  "coordinatorId" TEXT DEFAULT '',
  status TEXT DEFAULT 'activo',
  "sitesCount" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  "contractId" TEXT REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  "technicianId" TEXT DEFAULT '',
  status TEXT DEFAULT 'activa'
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  "contractId" TEXT REFERENCES contracts(id),
  "siteId" TEXT REFERENCES sites(id),
  description TEXT NOT NULL,
  type TEXT DEFAULT '',
  "technicianId" TEXT DEFAULT '',
  "scheduledDate" TEXT DEFAULT '',
  status TEXT DEFAULT 'solicitada',
  observations TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT 'Otros',
  stock NUMERIC DEFAULT 0,
  "minStock" NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  "materialId" TEXT REFERENCES materials(id),
  qty NUMERIC DEFAULT 0,
  origin TEXT DEFAULT '',
  destination TEXT DEFAULT '',
  "userId" TEXT DEFAULT '',
  date TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contractors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "workType" TEXT DEFAULT '',
  "contractId" TEXT REFERENCES contracts(id),
  "totalValue" NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  progress INTEGER DEFAULT 0,
  "nextMilestone" TEXT DEFAULT '',
  status TEXT DEFAULT 'proceso'
);

CREATE TABLE IF NOT EXISTS cost_entries (
  id TEXT PRIMARY KEY,
  date TEXT DEFAULT '',
  "contractId" TEXT REFERENCES contracts(id),
  category TEXT DEFAULT '',
  provider TEXT DEFAULT '',
  description TEXT DEFAULT '',
  value NUMERIC DEFAULT 0,
  "paymentType" TEXT DEFAULT '',
  reference TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  "technicianId" TEXT DEFAULT '',
  date TEXT DEFAULT '',
  "siteId" TEXT DEFAULT '',
  "checkIn" TEXT DEFAULT '',
  "checkOut" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS petty_cash (
  id TEXT PRIMARY KEY,
  "userId" TEXT DEFAULT '',
  amount NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  date TEXT DEFAULT '',
  status TEXT DEFAULT 'pendiente'
);

-- =============================================
-- SEED DATA (datos iniciales de demostración)
-- =============================================

INSERT INTO app_users (id, name, email, role, "contractIds", "siteIds") VALUES
('u1','Carlos Riveros','carlos@hyc.co','admin','{}','{}'),
('u2','Andrea Méndez','andrea@hyc.co','coordinador','{"c1"}','{}'),
('u3','Alexander Espinosa','alex@hyc.co','tecnico','{}','{"s1","s2","s3","s4","s5","s6"}'),
('u4','Miguel Tejedor','miguel@hyc.co','tecnico','{}','{"s7","s8","s9","s10","s11","s12"}'),
('u5','Harold Castro','harold@hyc.co','tecnico','{}','{"s13","s14","s15","s16","s17"}'),
('u6','Ismael Manjarrés','ismael@hyc.co','tecnico','{}','{"s18","s19","s20","s21"}'),
('u7','Nicolás Rodríguez','nicolas@hyc.co','tecnico','{}','{"s22","s23"}'),
('u8','Jorge Ramírez','jorge@hyc.co','conductor','{}','{}'),
('u9','Conjunto Virrey Solís','admin@virreysolis.co','cliente','{"c1"}','{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO contracts (id,"clientName",nit,"contactName","contactPhone","totalValue","monthlyBudget","startDate","endDate","coordinatorId",status,"sitesCount") VALUES
('c1','Conjunto Residencial Virrey Solís','900.123.456-7','María López','+57 310 555 0123',1480000000,55000000,'2025-02-04','2027-02-04','u2','activo',40)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sites (id,"contractId",name,address,"technicianId",status) VALUES
('s1','c1','Torre A — Apto 101','Cra 50 #122-15, Bogotá','u3','activa'),
('s2','c1','Torre A — Apto 201','Cra 50 #122-25, Bogotá','u3','activa'),
('s3','c1','Torre A — Apto 301','Cra 50 #122-35, Bogotá','u3','activa'),
('s4','c1','Torre A — Apto 401','Cra 50 #122-45, Bogotá','u3','activa'),
('s5','c1','Torre A — Apto 501','Cra 50 #122-55, Bogotá','u3','activa'),
('s6','c1','Torre A — Apto 601','Cra 50 #122-65, Bogotá','u3','activa'),
('s7','c1','Torre A — Apto 701','Cra 50 #122-75, Bogotá','u4','activa'),
('s8','c1','Torre A — Apto 801','Cra 50 #122-85, Bogotá','u4','activa'),
('s9','c1','Torre A — Apto 901','Cra 50 #122-95, Bogotá','u4','activa'),
('s10','c1','Torre A — Apto 1001','Cra 50 #122-105, Bogotá','u4','activa'),
('s11','c1','Torre A — Apto 1101','Cra 50 #122-115, Bogotá','u4','activa'),
('s12','c1','Torre A — Apto 1201','Cra 50 #122-125, Bogotá','u4','activa'),
('s13','c1','Torre B — Apto 101','Cra 50 #122-15, Bogotá','u5','activa'),
('s14','c1','Torre B — Apto 201','Cra 50 #122-25, Bogotá','u5','activa'),
('s15','c1','Torre B — Apto 301','Cra 50 #122-35, Bogotá','u5','mantenimiento'),
('s16','c1','Torre B — Apto 401','Cra 50 #122-45, Bogotá','u5','activa'),
('s17','c1','Torre B — Apto 501','Cra 50 #122-55, Bogotá','u5','activa'),
('s18','c1','Torre B — Apto 601','Cra 50 #122-65, Bogotá','u6','activa'),
('s19','c1','Torre B — Apto 701','Cra 50 #122-75, Bogotá','u6','activa'),
('s20','c1','Torre B — Apto 801','Cra 50 #122-85, Bogotá','u6','activa'),
('s21','c1','Torre B — Apto 901','Cra 50 #122-95, Bogotá','u6','activa'),
('s22','c1','Zonas Comunes — Lobby','Cra 50 #122-50, Bogotá','u7','activa'),
('s23','c1','Zonas Comunes — Salón Social','Cra 50 #122-50, Bogotá','u7','activa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (id,"contractId","siteId",description,type,"technicianId","scheduledDate",status) VALUES
('a1','c1','s1','Pintura de muros sala','Pintura','u3',CURRENT_DATE::TEXT,'ejecucion'),
('a2','c1','s2','Resane de fisuras techo','Resane','u3',CURRENT_DATE::TEXT,'completada'),
('a3','c1','s7','Cambio luminaria pasillo','Eléctrico','u4',CURRENT_DATE::TEXT,'programada'),
('a4','c1','s13','Limpieza tanques de agua','Tanques','u5',CURRENT_DATE::TEXT,'completada'),
('a5','c1','s18','Mantenimiento canales aguas lluvias','Canales','u6',CURRENT_DATE::TEXT,'ejecucion'),
('a6','c1','s22','Pintura lobby principal','Pintura','u7',CURRENT_DATE::TEXT,'recibida'),
('a7','c1','s3','Reparación grifería baño','Plomería','u3',CURRENT_DATE::TEXT,'solicitada'),
('a8','c1','s8','Revisión extintores piso 7','Extintores','u4',CURRENT_DATE::TEXT,'observacion'),
('a9','c1','s5','Aplicación segunda mano pintura','Pintura','u3',CURRENT_DATE::TEXT,'completada'),
('a10','c1','s10','Cambio sifón cocina','Plomería','u4',CURRENT_DATE::TEXT,'programada')
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id,name,unit,category,stock,"minStock") VALUES
('m1','Pintura Vinilo Tipo 1 Blanco','Galón','Pinturas',28,15),
('m2','Pintura Vinilo Tipo 1 Beige','Galón','Pinturas',12,15),
('m3','Estuco listo','Kilo','Pinturas',80,30),
('m4','Bombillo LED 9W','Unidad','Eléctrico',45,20),
('m5','Cinta aislante','Rollo','Eléctrico',8,10),
('m6','Tubo PVC 1/2"','Metro','Plomería',0,10),
('m7','Sifón cocina','Unidad','Plomería',6,5),
('m8','Brocha 4"','Unidad','Herramientas',14,8),
('m9','Rodillo felpa','Unidad','Herramientas',22,10),
('m10','Lija agua #320','Pliego','Otros',60,25)
ON CONFLICT (id) DO NOTHING;

INSERT INTO movements (id,type,"materialId",qty,origin,destination,"userId",date) VALUES
('mv1','entrada','m1',20,'Proveedor Pinturas SA','Bodega central','u8',CURRENT_DATE::TEXT),
('mv2','despacho','m1',5,'Bodega central','Torre A — Apto 101','u8',CURRENT_DATE::TEXT),
('mv3','entrega','m1',5,'Bodega central','Alexander Espinosa','u8',CURRENT_DATE::TEXT),
('mv4','devolucion','m8',2,'Torre B — Apto 301','Bodega central','u5',CURRENT_DATE::TEXT),
('mv5','despacho','m4',12,'Bodega central','Torre A — Apto 701','u8',CURRENT_DATE::TEXT)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contractors (id,name,"workType","contractId","totalValue",paid,progress,"nextMilestone",status) VALUES
('ct1','Viviana González','Pintura','c1',6200000,4000000,65,'Entrega pisos 5-8 Torre B — 28 abr','proceso'),
('ct2','Alexander Espinosa','Fachada','c1',18500000,1000000,40,'Resane fachada frontal — 5 may','proceso'),
('ct3','Sanitec Ltda','Tanques','c1',3800000,3800000,100,'Próxima inspección: ago 2026','esperando_recibo'),
('ct4','Extincol','Extintores','c1',2400000,0,25,'Recarga 8 extintores — 30 abr','observacion')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cost_entries (id,date,"contractId",category,provider,description,value,"paymentType",reference) VALUES
('ce1','2026-04-02','c1','Nómina','Nómina abril Q1','Nómina técnicos Q1',14250000,'Nómina','NOM-2026-04-01'),
('ce2','2026-04-15','c1','Nómina','Nómina abril Q2','Nómina técnicos Q2',14250000,'Nómina','NOM-2026-04-02'),
('ce3','2026-04-05','c1','Pintura','Pinturas Cóndor','Pintura blanco x 30 galones',5400000,'PSE','FAC-001234'),
('ce4','2026-04-18','c1','Pintura','Viviana González','Pago parcial pintura Torre B',2800000,'DP','DP-9821'),
('ce5','2026-04-08','c1','Fachada','Alexander Espinosa','Anticipo fachada frontal',6000000,'DP','DP-9810'),
('ce6','2026-04-12','c1','Transportes','Coopebombas','Combustible volqueta abril',2100000,'Efectivo','REC-447'),
('ce7','2026-04-20','c1','Materiales','Ferretería La 80','Material plomería y eléctrico',1800000,'PSE','FAC-7782'),
('ce8','2026-04-22','c1','Caja Menor','Varios','Reembolso caja menor abril',950000,'CA','CM-2026-04'),
('ce9','2026-04-25','c1','Otros','Servientrega','Envío documentos cliente',650000,'Efectivo','GUI-9981')
ON CONFLICT (id) DO NOTHING;

INSERT INTO attendance (id,"technicianId",date,"siteId","checkIn") VALUES
('at1','u3',CURRENT_DATE::TEXT,'s1','08:14'),
('at2','u4',CURRENT_DATE::TEXT,'s7','07:58'),
('at3','u5',CURRENT_DATE::TEXT,'s13','08:32'),
('at4','u6',CURRENT_DATE::TEXT,'s18','08:05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO petty_cash (id,"userId",amount,description,date,status) VALUES
('pc1','u3',45000,'Taxi materiales urgentes','2026-04-22','aprobado'),
('pc2','u4',28000,'Almuerzo equipo Torre A','2026-04-23','pendiente'),
('pc3','u5',65000,'Compra cinta aislante x 5','2026-04-23','pendiente'),
('pc4','u7',18000,'Bolsas industriales','2026-04-21','aprobado'),
('pc5','u6',32000,'Limpieza extra zonas comunes','2026-04-19','rechazado')
ON CONFLICT (id) DO NOTHING;
