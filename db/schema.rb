# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_21_154948) do
  create_table "audits", force: :cascade do |t|
    t.string "action"
    t.integer "associated_id"
    t.string "associated_type"
    t.integer "auditable_id"
    t.string "auditable_type"
    t.text "audited_changes"
    t.string "comment"
    t.datetime "created_at"
    t.string "remote_address"
    t.string "request_uuid"
    t.integer "user_id"
    t.string "user_type"
    t.string "username"
    t.integer "version", default: 0
    t.index ["associated_type", "associated_id"], name: "associated_index"
    t.index ["auditable_type", "auditable_id", "version"], name: "auditable_index"
    t.index ["created_at"], name: "index_audits_on_created_at"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "user_index"
  end

  create_table "monitorings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.float "data"
    t.string "method"
    t.integer "pet_id", null: false
    t.integer "type"
    t.integer "unit"
    t.datetime "updated_at", null: false
    t.index ["pet_id"], name: "index_monitorings_on_pet_id"
  end

  create_table "pets", force: :cascade do |t|
    t.date "birth_date"
    t.string "color"
    t.datetime "created_at", null: false
    t.integer "gender"
    t.string "name"
    t.string "owner_phone"
    t.string "rfid"
    t.integer "species_id", null: false
    t.integer "status"
    t.boolean "sterilized"
    t.float "temperature"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.float "weight"
    t.index ["owner_phone"], name: "index_pets_on_owner_phone"
    t.index ["species_id"], name: "index_pets_on_species_id"
    t.index ["user_id"], name: "index_pets_on_user_id"
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["name"], name: "index_roles_on_name"
    t.index ["resource_type", "resource_id"], name: "index_roles_on_resource"
  end

  create_table "species", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "sub_treatments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.float "fee"
    t.integer "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["treatment_id"], name: "index_sub_treatments_on_treatment_id"
    t.index ["user_id"], name: "index_sub_treatments_on_user_id"
  end

  create_table "treatments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.float "fee"
    t.string "title"
    t.integer "type"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_treatments_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "address"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.string "phone_number", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.integer "vet_id"
    t.integer "vet_role"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["phone_number"], name: "index_users_on_phone_number", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["vet_id"], name: "index_users_on_vet_id"
  end

  create_table "users_roles", id: false, force: :cascade do |t|
    t.integer "role_id"
    t.integer "user_id"
    t.index ["role_id"], name: "index_users_roles_on_role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id"
    t.index ["user_id"], name: "index_users_roles_on_user_id"
  end

  create_table "vet_invites", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "phone"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.integer "vet_id", null: false
    t.index ["user_id"], name: "index_vet_invites_on_user_id"
    t.index ["vet_id"], name: "index_vet_invites_on_vet_id"
  end

  create_table "vets", force: :cascade do |t|
    t.string "address"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "monitorings", "pets"
  add_foreign_key "pets", "species"
  add_foreign_key "pets", "users"
  add_foreign_key "sub_treatments", "treatments"
  add_foreign_key "sub_treatments", "users"
  add_foreign_key "treatments", "users"
  add_foreign_key "users", "vets"
  add_foreign_key "vet_invites", "users"
  add_foreign_key "vet_invites", "vets"
end
