class CreateVetInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :vet_invites do |t|
      t.string :phone
      t.references :vet, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.integer :status

      t.timestamps
    end
  end
end
