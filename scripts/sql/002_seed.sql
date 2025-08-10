insert into departments (name, location) values
  ('Computer Science', 'Block A'),
  ('Electrical', 'Block B'),
  ('Mechanical', 'Block C')
on conflict do nothing;

insert into vendors (vendor_id, company_name, contact_person, email, cpcb_registration_no) values
  ('00000000-0000-0000-0000-000000000001','GreenCycle Pvt Ltd','Asha','ops@greencycle.example','CPCB-12345'),
  ('00000000-0000-0000-0000-000000000002','EcoWaste Solutions','Ravi','contact@ecowaste.example','CPCB-67890')
on conflict do nothing;
